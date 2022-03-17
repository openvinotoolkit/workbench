"""
 OpenVINO DL Workbench
 Class for model input shape analysis job

 Copyright (c) 2021 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
from contextlib import closing
from typing import Dict, List, Any

from sqlalchemy.orm import Session

from model_analyzer.shape_utils import get_shape_for_node_safely
from openvino.runtime import Core, Model

from wb.error.job_error import ModelAnalyzerError
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum, StatusEnum, ModelAnalyzerErrorMessagesEnum
from wb.main.jobs.models.base_model_related_job import BaseModelRelatedJob
from wb.main.models import ModelShapeConfigurationModel, TopologiesModel, AnalyzeModelInputShapeJobModel
from wb.main.models.model_shape_configuration_model import InputShapeConfiguration
from wb.main.utils.utils import find_by_ext


class AnalyzeModelInputShapeJob(BaseModelRelatedJob):
    """
    Fills the analysis data for the model: g_flops, g_iops, max_mem etc.

    This is the only correct place to set `TopologiesModel.precision` and `TopologiesModel.size`.
    """
    job_type = JobTypesEnum.analyze_model_input_shape_type
    _job_model_class = AnalyzeModelInputShapeJobModel

    def __init__(self, job_id: int, **unused_args):
        super().__init__(job_id=job_id)

    def run(self):
        self._job_state_subject.update_state(log='Starting model input shape analysis',
                                             status=StatusEnum.running, progress=0)
        with closing(get_db_session_for_celery()) as session:
            job_model: AnalyzeModelInputShapeJobModel = self.get_job_model(session)
            model: TopologiesModel = job_model.model

            status_to_skip = (StatusEnum.cancelled, StatusEnum.queued, StatusEnum.error)
            if model.status in status_to_skip:
                return

            topology_xml = find_by_ext(model.path, 'xml')
            topology_bin = find_by_ext(model.path, 'bin')

            try:
                core = Core()
                openvino_model: Model = core.read_model(model=topology_xml, weights=topology_bin)
            except RuntimeError as exc:
                if str(exc).startswith('The support of IR'):
                    exc = ModelAnalyzerError(ModelAnalyzerErrorMessagesEnum.DEPRECATED_IR_VERSION.value, self._job_id)
                raise exc

            input_shapes = []
            for input_index, model_input in enumerate(openvino_model.inputs):
                node = model_input.node
                input_name = node.get_friendly_name()

                input_shapes.append(
                    InputShapeConfiguration(
                        name=input_name,
                        index=input_index,
                        shape=get_shape_for_node_safely(model_input),
                    )
                )

            self.fill_model_shape_configuration(model.id, input_shapes, session)

        self._job_state_subject.update_state(status=StatusEnum.ready,
                                             log='Model input shape analysis job successfully finished',
                                             progress=100)

        self._job_state_subject.detach_all_observers()

    @staticmethod
    def fill_model_shape_configuration(model_id: int,
                                       shape: List[Dict[str, Any]],
                                       session: Session):
        model_shape_configuration = ModelShapeConfigurationModel(model_id, shape)
        model_shape_configuration.status = StatusEnum.ready
        model_shape_configuration.write_record(session)
