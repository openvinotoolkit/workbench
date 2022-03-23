"""
 OpenVINO DL Workbench
 Model Optimizer arguments processor

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
import re
from contextlib import suppress
from pathlib import Path
from typing import Dict, List, Optional

from sqlalchemy import and_
from werkzeug.utils import secure_filename

from wb.error.job_error import ModelOptimizerError
from wb.extensions_factories.database import get_db_session_for_app
from wb.main.enumerates import ConfigFileNames, ModelColorChannelsEnum, SupportedFrameworksEnum, StatusEnum
from wb.main.models import FilesModel
from wb.main.utils.utils import get_framework_name, get_size_of_files


def save_config_file(config_file_name: str, content: str, topology_id: int, topology_path: str):
    config_path = Path(topology_path) / config_file_name
    with config_path.open('w') as pipeline_config_file:
        pipeline_config_file.writelines(content)
    size = get_size_of_files(str(config_path))
    config_file_record = FilesModel(config_file_name, topology_id, size)
    config_file_record.progress = 100
    config_file_record.status = StatusEnum.ready
    config_file_record.uploaded_blob_size = size
    config_file_record.path = str(config_path)
    config_file_record.write_record(get_db_session_for_app())


def clean_config_information(topology_id: int, config_file_name: ConfigFileNames):
    config_record: FilesModel = FilesModel.query.filter(
        and_(
            FilesModel.artifact_id == topology_id,
            FilesModel.name == config_file_name.value
        )
    ).first()

    if not config_record:
        return

    config_path = Path(config_record.path)

    if config_path.exists():
        config_path.unlink()
    config_record.delete_record(session=get_db_session_for_app())


class MOArgProcessor:
    _framework_to_options = {
        SupportedFrameworksEnum.caffe: {
            frozenset(['.caffemodel', '.prototxt']): {
                'arg_to_ext': {
                    'input_model': '.caffemodel',
                    'input_proto': '.prototxt',
                },
            },
        },
        SupportedFrameworksEnum.mxnet: {
            frozenset(['.params']): {
                'arg_to_ext': {
                    'input_model': '.params',
                },
            },
        },
        SupportedFrameworksEnum.onnx: {
            frozenset(['.onnx']): {
                'arg_to_ext': {
                    'input_model': '.onnx',
                },
            },
        },
        SupportedFrameworksEnum.tf: {
            frozenset(['.pb']): {
                'arg_to_ext': {
                    'input_model': '.pb',
                    'input_checkpoint': '.ckpt',  # For non-frozen models.
                },
            },
            frozenset(['.pbtxt']): {
                'arg_to_ext': {
                    'input_model': '.pbtxt',
                    'input_checkpoint': '.ckpt',  # For non-frozen models.
                },
                'additional_args': {
                    'input_model_is_text': True,
                },
            },
            frozenset(['.meta', '.index', '.data-00000-of-00001']): {
                'arg_to_ext': {
                    'input_meta_graph': '.meta',
                },
            },
        },
    }

    def __init__(self, mo_job: 'ModelOptimizerJobModel'):
        self.mo_job = mo_job

    @staticmethod
    def _extract_transformation_config(topology: 'TopologiesModel', data: dict):
        if 'customTransformationsConfig' not in data:
            clean_config_information(topology.id, ConfigFileNames.transformations_config)
        config_file_content = data.pop('customTransformationsConfig', None)
        if config_file_content:
            save_config_file(config_file_name=ConfigFileNames.transformations_config.value,
                             content=config_file_content,
                             topology_id=topology.id,
                             topology_path=topology.path)

    @staticmethod
    def _extract_pipeline_config(topology: 'TopologiesModel', data: dict):
        if 'pipelineConfigFile' not in data:
            clean_config_information(topology.id, ConfigFileNames.tf_pipeline_config)
        config_file_content = data.pop('pipelineConfigFile', None)
        if config_file_content:
            save_config_file(config_file_name=ConfigFileNames.tf_pipeline_config.value,
                             content=config_file_content,
                             topology_id=topology.id,
                             topology_path=topology.path)

    def extract_config_files(self, data: Dict):
        original_topology = self.mo_job.original_topology
        self._extract_pipeline_config(original_topology, data)
        self._extract_transformation_config(original_topology, data)

    @staticmethod
    def process_file_args(job_id: int, mo_args: Dict, topology: 'TopologiesModel'):
        file_paths = [file.path for file in topology.files]

        extension_to_path = {}
        for file in topology.files:
            parent_path = Path(file.path).parent
            if parent_path.name == 'checkpoint':
                extension_to_path['.ckpt'] = str(parent_path)
                continue
            extension = MOArgProcessor.get_file_extension(file.path)
            extension_to_path[extension] = file.path

        MOArgProcessor.add_config_files(file_paths, mo_args)

        if topology.framework in (SupportedFrameworksEnum.tf2, SupportedFrameworksEnum.tf2_keras):
            mo_args['saved_model_dir'] = topology.path
            return

        for required_extensions, args in MOArgProcessor._framework_to_options[topology.framework].items():
            if required_extensions <= set(extension_to_path.keys()):
                for arg, ext in args['arg_to_ext'].items():
                    with suppress(KeyError):
                        mo_args[arg] = extension_to_path[ext]
                if 'additional_args' in args:
                    mo_args.update(args['additional_args'])
                break
        else:
            ModelOptimizerError('Some files are missing.', job_id)

    @staticmethod
    def add_config_files(file_paths: List[str], mo_args: Dict):
        for path in file_paths:
            if Path(path).name == ConfigFileNames.tf_pipeline_config.value:
                mo_args['tensorflow_object_detection_api_pipeline_config'] = path
            if Path(path).name == ConfigFileNames.transformations_config.value:
                mo_args['transformations_config'] = path

    @staticmethod
    def get_file_extension(path: str) -> str:
        ext = Path(path).suffix
        if re.fullmatch(r'\.data-[0-9]{5}-of-[0-9]{5}', ext):
            ext = '.data-00000-of-00001'
        return ext

    def add_misc_arguments(self, model_path: str, mo_args: Dict):
        topology = self.mo_job.original_topology
        mo_args.update({
            'model_name': secure_filename(topology.name),
            'framework': get_framework_name(topology.framework),
            'output_dir': model_path,
            'progress': True,
            'stream_output': True,
        })
        if 'reverse_input_channels' in mo_args:
            # Convert from colors to boolean
            mo_args['reverse_input_channels'] = mo_args['reverse_input_channels'] == ModelColorChannelsEnum.RGB.value
        layout_for_cli = self._prepare_layout_for_cli(mo_args.get('layout', {}))
        if layout_for_cli:
            mo_args['layout'] = layout_for_cli

    @staticmethod
    def _prepare_layout_for_cli(layout: dict) -> Optional[str]:
        if not layout:
            return None
        layouts_per_input = {}
        for i, layout in layout.items():
            layouts_per_input[i] = ''.join(l for l in layout)
        return ','.join(
            f'{input_name}({layout})'
            for input_name, layout in layouts_per_input.items()
        )
