"""
 OpenVINO DL Workbench
 Class for model analysis job

 Copyright (c) 2021 Intel Corporation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
      http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
"""
import json
import logging
import re
from contextlib import closing, suppress, contextmanager
from pathlib import Path
from traceback import format_exception
from typing import List, Dict, Any

from model_analyzer.model_complexity import ModelComputationalComplexity
from model_analyzer.model_metadata import ModelMetaData
from model_analyzer.shape_utils import get_shape_for_node_safely
from model_analyzer.model_type_analyzer import ModelTypeAnalyzerCreator, ModelTypeGuesser

# pylint: disable=import-error,no-name-in-module
from openvino.runtime import Core, Node

from sqlalchemy.orm import Session


from wb.error.job_error import ModelAnalyzerError
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import (JobTypesEnum, StatusEnum, SupportedFrameworksEnum, TaskMethodEnum,
                                ModelAnalyzerErrorMessagesEnum, LayoutDimValuesEnum)
from wb.main.jobs.models.base_model_related_job import BaseModelRelatedJob
from wb.main.models import TopologiesModel, TopologyAnalysisJobsModel, ModelOptimizerJobModel
from wb.main.models.topologies_metadata_model import InputLayoutConfiguration
from wb.main.utils.utils import find_by_ext, get_size_of_files


class ModelAnalyzerJob(BaseModelRelatedJob):
    """
    Fills the analysis data for the model: g_flops, g_iops, max_mem etc.

    This is the only correct place to set `TopologiesModel.precision` and `TopologiesModel.size`.
    """
    job_type = JobTypesEnum.model_analyzer_type
    _job_model_class = TopologyAnalysisJobsModel

    def __init__(self, job_id: int, **unused_args):
        super().__init__(job_id=job_id)
        self.errors = []

    def run(self):
        self._job_state_subject.update_state(log='Starting model analysis', status=StatusEnum.running)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            topology_analysis_job_model: TopologyAnalysisJobsModel = self.get_job_model(session)
            topology_record: TopologiesModel = topology_analysis_job_model.model

            if topology_record.status in (StatusEnum.cancelled, StatusEnum.queued, StatusEnum.error):
                return

            if not topology_record.is_shape_configured and not topology_record.optimized_from_record:
                self.on_success()
                return

            topology_xml = find_by_ext(topology_record.path, 'xml')
            topology_bin = find_by_ext(topology_record.path, 'bin')

            try:
                core = Core()
                core.read_model(model=topology_xml, weights=topology_bin)
            except RuntimeError as exc:
                if str(exc).startswith('The support of IR'):
                    exc = ModelAnalyzerError(ModelAnalyzerErrorMessagesEnum.DEPRECATED_IR_VERSION.value, self._job_id)
                raise exc
            with self.suppress_and_log():
                self.analyze(
                    topology_record, topology_analysis_job_model,
                    topology_xml, topology_bin, session
                )

            topology_record.size = get_size_of_files(topology_record.path)
            topology_record.write_record(session)

            self.rename_files(topology_record.path)

            layout_config = self._get_model_layout(
                xml_path=topology_xml,
                bin_path=topology_bin,
            )
            topology_record.meta.layout_configuration = layout_config
            topology_record.meta.write_record(session)

        self.on_success()

    def analyze(self,
                topology: TopologiesModel,
                topology_analysis: TopologyAnalysisJobsModel,
                model_xml: str,
                model_bin: str,
                session: Session):
        with self.suppress_and_log():
            model_metadata = ModelMetaData(Path(model_xml), Path(model_bin))

            if model_metadata.ir_version <= 10:
                raise ModelAnalyzerError(ModelAnalyzerErrorMessagesEnum.DEPRECATED_IR_VERSION.value, self._job_id)

            topology_analysis.batch = model_metadata.batch or 1

            mo_params = model_metadata.mo_params
            if mo_params:
                topology_analysis.mo_params = json.dumps(self.process_mo_cli_parameters(mo_params))

            topology_analysis.ir_version = model_metadata.ir_version
            topology_analysis.has_batchnorm = model_metadata.has_op_of_type(('BatchNormInference', 'BatchNormalization'))
            topology_analysis.is_int8 = model_metadata.is_int8()

            topology_type = ModelTypeGuesser.get_model_type(model_metadata)
            topology_analysis.topology_type = topology_type

            topology_analysis.num_classes = model_metadata.num_classes
            topology_analysis.has_background = model_metadata.has_background_class

            self._job_state_subject.update_state(progress=30)

            # Get network I/O
            topology_analysis.inputs = json.dumps([model_input.any_name for model_input in model_metadata.inputs])
            topology_analysis.outputs = json.dumps([output.any_name for output in model_metadata.outputs])
            topology_analysis.op_sets = model_metadata.op_sets

            # Process topology-specific params
            model_type_analyzer = ModelTypeAnalyzerCreator.create(topology_type, model_metadata)
            topology_specific = model_type_analyzer.specific_parameters
            topology_analysis.topology_specific = json.dumps(topology_specific)

            self._job_state_subject.update_state(progress=60)

            mcc = ModelComputationalComplexity(model_metadata)

            topology.set_precisions(mcc.executable_precisions)

            g_flops, g_iops = mcc.get_total_ops()
            topology_analysis.g_flops = f'{g_flops:.5f}'
            topology_analysis.g_iops = f'{g_iops:.5f}'

            topology_analysis.maximum_memory = f'{mcc.get_maximum_memory_consumption() / 10 ** 6:.3f}'
            topology_analysis.minimum_memory = f'{mcc.get_minimum_memory_consumption() / 10 ** 6:.3f}'
            topology_analysis.m_params = f'{mcc.get_total_params()["total_params"] / 10 ** 6:.3f}'
            sparsity = (mcc.get_total_params()['zero_params'] / mcc.get_total_params()['total_params'] * 100
                        if mcc.get_total_params()['total_params'] else 0)
            topology_analysis.sparsity = f'{sparsity:.3f}'
            if topology.precisions is None:
                topology.set_precisions([mo_params['data_type']])

        self._job_state_subject.update_state(progress=90)

        if self.errors:
            topology_analysis.error_message = str(self.errors)
        topology_analysis.write_record(session)

    @staticmethod
    def _get_model_layout(xml_path: str, bin_path: str) -> List[Dict[str, Any]]:

        core = Core()
        model = core.read_model(xml_path, bin_path)
        layout_config = []

        for index, model_input in enumerate(model.inputs):
            node = model_input.node
            name = node.get_friendly_name()
            layout_config.append(
                InputLayoutConfiguration(
                    name=name,
                    index=index,
                    layout=ModelAnalyzerJob._parse_layout_to_array(node)
                )
            )

        return layout_config

    @staticmethod
    def _parse_layout_to_array(node: Node) -> List[str]:
        layout_str = str(node.get_layout())
        layout_match = re.search(r'\[(?P<layout>.*)]', layout_str)
        if not layout_match:
            return [LayoutDimValuesEnum.OTHER.value, ]
        clear_layout = layout_match.group('layout')
        if clear_layout == '...':
            return ModelAnalyzerJob._get_fully_undefined_layout(node)
        return [dim for dim in clear_layout.split(',')]

    @staticmethod
    def _get_fully_undefined_layout(node: Node) -> List[str]:
        shape = get_shape_for_node_safely(node)
        return [LayoutDimValuesEnum.OTHER.value for _ in shape]

    @staticmethod
    def process_mo_cli_parameters(parameters):
        """Filter and parse MO CLI params extracted from IR."""

        def parse_bool(param: str) -> bool:
            return {'True': True, 'False': False}[param]

        def reset_empty(param: str):
            return None if not param or param in ('()', '{}', '[]') else param

        def parse_shape_means_scales(param: str) -> str:
            param = reset_empty(param)
            return param.replace('[', '(').replace(']', ')') if param else param

        def parse_output(param: str) -> str:
            param = reset_empty(param)
            return param.translate(str.maketrans(dict.fromkeys('][\'\"'))) if param else param

        def parse_tf_config(param: str) -> str:
            return param.replace('DIR/', '') if param else param

        parameters_to_keep = {
            'framework': str,
            'data_type': str,
            'batch': int,
            'reverse_input_channels': parse_bool,
            'input': reset_empty,
            'input_shape': parse_shape_means_scales,
            'mean_values': parse_shape_means_scales,
            'scale_values': parse_shape_means_scales,
            'output': parse_output,
            # TensorFlow
            'input_checkpoint': str,
            'input_meta_graph': parse_tf_config,
            'tensorflow_use_custom_operations_config': parse_tf_config,
            'tensorflow_object_detection_api_pipeline_config': parse_tf_config,
            # Caffe

            # MxNet
            'legacy_mxnet_model': parse_bool,
            'enable_ssd_gluoncv': parse_bool,
        }

        result = {}
        for key, value in parameters.items():
            with suppress(KeyError):
                result[key] = parameters_to_keep[key](value)

        with suppress(KeyError):
            if result.get('framework') == SupportedFrameworksEnum.tf.value:
                result['frozen'] = bool(not result.get('input_checkpoint') and not result.get('input_meta_graph'))

        return result

    @staticmethod
    def rename_files(model_path: str):
        xml_file = Path(find_by_ext(model_path, 'xml'))
        xml_file_name = xml_file.stem
        bin_file = Path(find_by_ext(model_path, 'bin'))
        bin_file_name = bin_file.stem
        if xml_file.stem == bin_file_name:
            return
        bin_target = Path(xml_file.parent) / Path(f'{xml_file_name}.bin')
        bin_file.rename(bin_target)

    def on_failure(self, exception: Exception):
        error_message = str(exception)
        known_errors = {
            'Error reading network: deprecated IR version: 0': 'Invalid IR XML',
            'Error loading xmlfile: ./blank.xml, No document element found at line: 1 pos: 0': 'Invalid XML',
            'segment exceeds given buffer limits. Please, validate weights file': 'Invalid IR BIN',
        }
        error_message = known_errors[error_message] if error_message in known_errors else error_message
        error = ModelAnalyzerError(error_message, self.job_id)
        super().on_failure(error)

    @contextmanager
    def suppress_and_log(self):
        try:
            yield
        except ModelAnalyzerError as model_analyzer_error:
            raise model_analyzer_error
        except Exception as exception:
            logging.error(exception, exc_info=True)
            self.errors.append(''.join(format_exception(type(exception), exception, exception.__traceback__)))

    @staticmethod
    def set_model_optimizer_error(topology: TopologiesModel, error_message: str, session: Session):
        mo_job: ModelOptimizerJobModel = topology.mo_jobs_from_result[-1]
        mo_job.status = StatusEnum.error
        mo_job.error_message = error_message
        mo_job.detailed_error_message = error_message
        mo_job.write_record(session)

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready,
                                             log='Model analysis job successfully finished')
        self._job_state_subject.detach_all_observers()
