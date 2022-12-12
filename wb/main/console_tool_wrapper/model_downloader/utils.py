"""
 OpenVINO DL Workbench
 Utils for work with OMZ tools

 Copyright (c) 2018 Intel Corporation

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
import pathlib
from itertools import chain
from pathlib import Path
from typing import Union, Dict, Optional

import yaml
from sqlalchemy.sql.elements import and_
from model_analyzer.constants import YoloAnchors

from config.constants import ACCURACY_CHECKER_PATH, OPEN_MODEL_ZOO_MODELS_PATH, DATASET_DEFINITIONS_PATH
from wb.extensions_factories.database import get_db_session_for_app
from wb.main.accuracy_utils.yml_abstractions import Adapter
from wb.main.accuracy_utils.yml_templates.adapter_templates import format_yolo_anchors
from wb.main.accuracy_utils.yml_templates.registry import ConfigRegistry
from wb.main.console_tool_wrapper.model_downloader.info_dumper_parser import InfoDumperParser
from wb.main.console_tool_wrapper.model_downloader.info_dumper_tool import InfoDumperTool
from wb.main.enumerates import TaskMethodEnum, SupportedFrameworksEnum, ModelPrecisionEnum
from wb.main.jobs.tools_runner.local_runner import LocalRunner
from wb.main.models import ModelPrecisionsModel, OMZTopologyModel, WBInfoModel
from wb.main.shared.enumerates import TaskEnum


def get_topology_task_by_task_method(task_method: TaskMethodEnum,
                                     model_info_dumper_information: dict) -> TaskEnum:
    topology_task__method_to_task_map = {
        TaskMethodEnum.classificator: TaskEnum.classification,
        TaskMethodEnum.ssd: TaskEnum.object_detection,
        TaskMethodEnum.tiny_yolo_v2: TaskEnum.object_detection,
        TaskMethodEnum.yolo_v2: TaskEnum.object_detection,
        TaskMethodEnum.yolo_v3: TaskEnum.object_detection,
        TaskMethodEnum.yolo_v4: TaskEnum.object_detection,
        TaskMethodEnum.tiny_yolo_v3_v4: TaskEnum.object_detection,
        TaskMethodEnum.mask_rcnn: TaskEnum.instance_segmentation,
        TaskMethodEnum.segmentation: TaskEnum.semantic_segmentation,
        TaskMethodEnum.inpainting: TaskEnum.inpainting,
        TaskMethodEnum.style_transfer: TaskEnum.style_transfer,
        TaskMethodEnum.super_resolution: TaskEnum.super_resolution,
        TaskMethodEnum.face_recognition: TaskEnum.face_recognition,
        TaskMethodEnum.landmark_detection: TaskEnum.landmark_detection,
        TaskMethodEnum.generic: TaskEnum.generic,
    }

    guessed_topology_type = topology_task__method_to_task_map.get(task_method, TaskEnum.generic)

    task_type_from_model_info = model_info_dumper_information['task_type']

    # handle person-detection-0106 model with maskrcnn adapter configured to return boxes only
    if task_method == TaskMethodEnum.mask_rcnn and task_type_from_model_info == 'detection':
        return TaskEnum.object_detection

    if (guessed_topology_type == TaskEnum.face_recognition and
            task_type_from_model_info == 'object_attributes'):
        return TaskEnum.generic

    return topology_task__method_to_task_map.get(task_method, TaskEnum.generic)


def read_models_config_from_file(relative_model_config_path: Path) -> dict:
    accuracy_checker_path = Path(ACCURACY_CHECKER_PATH)
    model_config_path = accuracy_checker_path / 'configs' / relative_model_config_path
    model_config_path = model_config_path.resolve()
    with open(str(model_config_path)) as model_config:
        config = yaml.safe_load(model_config)
    return config['models']


def get_models_config(model_content: Union[str, dict]) -> dict:
    if isinstance(model_content, str):
        return read_models_config_from_file(Path(model_content))
    return model_content['models']


def get_accuracy_config_for_openvino_framework(model_name: str, accuracy_config_content: dict) -> Optional[dict]:
    """
    Find and return a suitable config, if exists.

    There are usually a couple of configs in a YAML file:

    1. for the original model in source framework;
    2. for the IR converted from the original model.

    We need the second config.
    It has a launcher with framework property equal to 'openvino'.

    :param model_name: str - name of the model
    :param accuracy_config_content: dict - content of the accuracy checker config for the model
    :return: configuration for OpenVINO framework, if exists, otherwise None
    """

    ir_configs = tuple(
        config
        for config in get_models_config(accuracy_config_content)
        if 'openvino' in [launcher['framework'] for launcher in config['launchers']]
    )

    if not ir_configs:
        logging.warning('No sutable configs in %s.yml. Skipping.', model_name)
        return None

    if len(ir_configs) > 1:
        logging.warning(
            'More then one sutable config in %s.yml. Using the first one: %s.', model_name, ir_configs[0]['name'])

    return ir_configs[0]


def extract_dataset_config(model_name: str, accuracy_config: dict) -> Optional[dict]:
    """
        Find and return a dataset config from a given model config, if exists.

    Model config is expected to have "datasets" section,
    which is expected to have one entry with a dataset-related configurations.

    There may be special cases:

    * the section may be absent;
    * the section may be empty;
    * the section may have several enrties.

    These cases should not lead to fatal errors.

    :param model_name: str - name of the model
    :param accuracy_config: dict - content of the accuracy configuration for the model
    :return: dict - the first entry from "datasets" section from accuracy configuration if exists, otherwise None
    """

    datasets_section = accuracy_config.get('datasets')
    if not datasets_section:
        return None

    if len(datasets_section) > 1:
        logging.warning(
            'More then one suitable entry in the "datasets" section of %s config from %s.yml. '
            'Using the first one.',
            accuracy_config['name'],
            model_name
        )
    return datasets_section[0]


def extract_launcher_config(accuracy_config: dict) -> Optional[dict]:
    """
    Find and return a suitable launcher config from a given model config, if exists.

    Model config is expected to have "launchers" section,
    which usually has a couple of entries,
    having "framework" property equal to "openvino"
    and differing only in precision of the IR used.
    We can use any of them.

    There may be special cases:

    * the section may be absent;
    * the section may be empty;
    * the section may have an entry with framework property not equal to "openvino".

    These cases should not lead to fatal errors.
    :param model_name: str - name of the model
    :param accuracy_config: dict - content of the accuracy configuration for the model
    :return: dict - the first entry  with framework "openvino" from "launchers" section
                    from accuracy configuration if exists, otherwise None
    """

    launchers_section = accuracy_config.get('launchers', ())

    launchers_section = tuple(
        launcher_config
        for launcher_config in launchers_section
        if launcher_config['framework'] == 'openvino'
    )

    if not launchers_section:
        return None
    launcher_config = launchers_section[0]

    if isinstance(launcher_config['adapter'], str):
        launcher_config['adapter'] = {'type': launcher_config['adapter']}

    return launcher_config


def merge_defaults(defaults: dict, config: dict) -> dict:
    identifier = config['name']
    default = defaults.get(identifier, {})
    result = dict(**default)
    result.update(config)
    return result


def get_reversed_supported_adapters_map() -> Dict[str, TaskMethodEnum]:
    """
    Return adapter to topology_type map for supported topology_types.
    """
    adapters_to_task_methods: Dict[str, TaskMethodEnum] = {}
    for task_method, adapter_class in ConfigRegistry.task_method_registry.items():
        adapter: Adapter = adapter_class()
        adapter_as_dict = json.dumps(adapter.to_dict(), sort_keys=True)
        adapters_to_task_methods[adapter_as_dict] = task_method

    return adapters_to_task_methods


def get_datasets_default_definitions() -> dict:
    defaults_file_path = Path(DATASET_DEFINITIONS_PATH)

    with defaults_file_path.open() as defaults_file:
        defaults_file_contents = yaml.safe_load(defaults_file)
    return {dd['name']: dd for dd in defaults_file_contents['datasets']}


def get_metadata_from_config(config_file_path: Path) -> Optional[dict]:
    with config_file_path.open() as config_file:
        try:
            return yaml.safe_load(config_file)
        except yaml.YAMLError:
            return None


def get_metadata_from_model_config(model_name: str) -> Optional[dict]:
    public_model_config_path = OPEN_MODEL_ZOO_MODELS_PATH / 'public' / model_name / 'model.yml'
    if public_model_config_path.is_file():
        return get_metadata_from_config(public_model_config_path)
    intel_model_config_path = OPEN_MODEL_ZOO_MODELS_PATH / 'intel' / model_name / 'model.yml'
    if intel_model_config_path.is_file():
        return get_metadata_from_config(intel_model_config_path)
    return None


def get_model_files_source(model_name: str) -> Optional[str]:
    model_metadata = get_metadata_from_model_config(model_name)
    if not model_metadata:
        return None
    model_files = model_metadata['files']
    sources = []
    for model_file in model_files:
        file_source = model_file['source']
        if isinstance(file_source, str):
            sources.append(file_source)
        if isinstance(file_source, dict):
            sources.append(file_source.get('$type'))
    return ','.join(sources)


def get_metadata_from_accuracy_configs() -> Dict[str, dict]:
    """Extract from YAML configs and return metadata for OMZ models."""

    adapter_to_topology_type_map = get_reversed_supported_adapters_map()
    datasets_defaults = get_datasets_default_definitions()

    metadata_from_accuracy_configs = {}

    for config_file_path in OPEN_MODEL_ZOO_MODELS_PATH.glob('**/accuracy-check.yml'):
        model_name = pathlib.PurePath(config_file_path).parent.name

        accuracy_model_metadata = get_metadata_from_config(config_file_path)

        if not accuracy_model_metadata:
            logging.warning('%s model is not supported because of incorrect configuration file: %s',
                            model_name, config_file_path)
            continue

        if 'models' not in accuracy_model_metadata:
            logging.warning('%s model is not supported because of %s does not contain field "models"',
                            model_name, config_file_path)
            continue

        try:
            accuracy_config = get_accuracy_config_for_openvino_framework(model_name, accuracy_model_metadata)
        except FileNotFoundError as error:
            logging.warning('%s model is not supported because file config (%s) does not exist',
                            model_name, error.filename)
            continue

        if not accuracy_config:
            continue

        dataset_config = extract_dataset_config(model_name, accuracy_config)
        if not dataset_config:
            logging.warning(
                'There are not entries in the "datasets" section or '
                'there is not "datasets" section in %s config from %s.yml. Skipping.',
                accuracy_config['name'], model_name)
            continue

        launcher_config = extract_launcher_config(accuracy_config)
        if not launcher_config:
            logging.warning(
                'There is not "launchers" section in config '
                'or there are not entries for "openvino" framework in the "launchers" section '
                'of %s config from %s.yml. Skipping.',
                accuracy_config['name'],
                model_name
            )
            continue

        dataset_config = merge_defaults(datasets_defaults, dataset_config)

        if 'annotation_conversion' not in dataset_config:
            logging.warning(
                '%s model is not supported because of dataset config does not contain field annotation_conversion',
                model_name, )
            continue

        model_dependent_annotation_conversion_params = set(chain.from_iterable(
            dataset_adapter.supported_task_specific_variables
            for dataset_recognizer in ConfigRegistry.dataset_recognizer_registry.values()
            for dataset_adapter in dataset_recognizer.task_type_to_adapter.values()
        ))

        advanced_configuration = {
            'preprocessing': dataset_config.get('preprocessing', []),
            'postprocessing': dataset_config.get('postprocessing', []),
            'metric': dataset_config.get('metrics', []),
            'annotationConversion': {
                key: value
                for key, value in dataset_config['annotation_conversion'].items()
                if key in model_dependent_annotation_conversion_params
            },
            'adapterConfiguration': {
                'adapter': launcher_config['adapter']
            }
        }
        metadata_from_accuracy_configs[model_name] = {
            'topology_type': get_topology_type(adapter_to_topology_type_map, launcher_config['adapter']),
            'advanced_configuration': advanced_configuration,
            'inputs': launcher_config['inputs'] if 'inputs' in launcher_config else None,
        }

    return metadata_from_accuracy_configs


def get_topology_type(adapter_to_topology_type_map: dict, topology_adapter: dict) -> TaskMethodEnum:
    topology_type = adapter_to_topology_type_map.get(
        json.dumps(topology_adapter, sort_keys=True),
        TaskMethodEnum.generic
    )
    if topology_type != TaskMethodEnum.generic:
        return topology_type
    parse_result = parse_yolo_adapter(topology_adapter)
    if parse_result != TaskMethodEnum.generic:
        return parse_result
    for adapter, topology_type in adapter_to_topology_type_map.items():
        adapter = json.loads(adapter)
        adapter_type = adapter['type']
        if adapter_type == topology_adapter['type']:
            return topology_type
    return TaskMethodEnum.generic


def parse_yolo_adapter(topology_adapter: dict) -> TaskMethodEnum:
    """
    Further check YOLOv2/v3 launcher config to determine if it's YOLOv2/v3/v4 or Tiny YOLOv2/v3/v4
    All listed models use the same adapter type, but differ in anchors and/or anchor masks.
    """
    yolo_anchors_to_yolo_type_map = {
        YoloAnchors.YOLO_V2: TaskMethodEnum.yolo_v2,
        YoloAnchors.TINY_YOLO_V2: TaskMethodEnum.tiny_yolo_v2,
        YoloAnchors.YOLO_V3: TaskMethodEnum.yolo_v3,
        YoloAnchors.YOLO_V4: TaskMethodEnum.yolo_v4,
        YoloAnchors.TINY_YOLO_V3_V4: TaskMethodEnum.tiny_yolo_v3_v4,
    }
    adapter_anchors = topology_adapter.get('anchors', None)
    if not adapter_anchors:
        return TaskMethodEnum.generic
    formatted_anchors = alias_to_anchors(str(adapter_anchors).replace(' ', ''))
    for yolo_anchors in YoloAnchors:
        if formatted_anchors == format_yolo_anchors(yolo_anchors):
            return yolo_anchors_to_yolo_type_map[yolo_anchors]
    return TaskMethodEnum.generic


def alias_to_anchors(alias: str) -> str:
    if alias == 'yolo_v2':
        return format_yolo_anchors(YoloAnchors.YOLO_V2)
    if alias == 'tiny_yolo_v2':
        return format_yolo_anchors(YoloAnchors.TINY_YOLO_V2)
    if alias == 'yolo_v3':
        return format_yolo_anchors(YoloAnchors.YOLO_V3)
    if alias == 'tiny_yolo_v3':
        return format_yolo_anchors(YoloAnchors.TINY_YOLO_V3_V4)
    return alias


def get_omz_models_data_from_info_dumper() -> Optional[dict]:
    parameters = InfoDumperTool()
    parser = InfoDumperParser()
    runner = LocalRunner(parameters, parser)

    return_code, _ = runner.run_console_tool()
    if return_code:
        raise RuntimeError
    return json.loads(parser.stdout)


def get_default_metadata() -> dict:
    return {
        'topology_type': TaskMethodEnum.generic,
        'advanced_configuration': None
    }


def fetch_downloadable_models():
    metadata_from_accuracy_configs = get_metadata_from_accuracy_configs()
    omz_models_from_info_dumper = get_omz_models_data_from_info_dumper()
    default_metadata = get_default_metadata()

    for model_data_from_info_dumper in omz_models_from_info_dumper:
        model_name = model_data_from_info_dumper['name']
        model_metadata_from_accuracy_config = metadata_from_accuracy_configs.get(model_name, default_metadata)

        if model_data_from_info_dumper['framework'] == 'dldt':
            model_data_from_info_dumper['framework'] = SupportedFrameworksEnum.openvino.value

        try:
            SupportedFrameworksEnum(model_data_from_info_dumper['framework'])
        except ValueError:
            logging.warning('Skip %s model due to unsupported framework %s', model_data_from_info_dumper['name'],
                            model_data_from_info_dumper['framework'])
            continue

        task_type = get_topology_task_by_task_method(model_metadata_from_accuracy_config['topology_type'],
                                                     model_data_from_info_dumper)

        config = dict(
            data=model_data_from_info_dumper,
            task_type=task_type,
            topology_type=model_metadata_from_accuracy_config['topology_type'],
            advanced_configuration=model_metadata_from_accuracy_config['advanced_configuration'],
            inputs=model_metadata_from_accuracy_config.get('inputs', []),
        )

        precisions = []
        for precision in model_data_from_info_dumper['precisions']:
            precisions.append(precision.split('-'))

        for full_precision in precisions:
            # for each model with mixed precision, e.g. FP32-FP16, a duplicate row in OMZTopologyModel table is created
            config['source'] = get_model_files_source(model_name)
            omz_record = OMZTopologyModel(**config)
            omz_record.write_record(get_db_session_for_app())

            for precision in full_precision:
                precision_record = ModelPrecisionsModel(
                    omz_record.id,
                    ModelPrecisionEnum(precision)
                )
                precision_record.write_record(get_db_session_for_app())


def is_model_available(model: OMZTopologyModel) -> bool:
    wb_info: WBInfoModel = WBInfoModel.query.first()
    is_prc = wb_info.is_prc
    hosts_black_list = (
        'google_drive',
        'githubusercontent.com',
        'storage.googleapis.com',
        'download.tensorflow.org'
    )
    if not is_prc or not model.source:
        return True
    for blocked_host in hosts_black_list:
        if blocked_host in model.source:
            return False
    return True


def aggregate_topologies():
    # Filter rule #1: Show only models with not generic type
    not_supported_topologies = ('aclnet',
                                'asl-recognition-0004',
                                'common-sign-language-0001',
                                'common-sign-language-0002',
                                'facial-landmarks-35-adas-0002',
                                'i3d-rgb-tf',
                                'mixnet-l',
                                'netvlad-tf',
                                'open-closed-eye-0001',
                                # TODO: unskip when 65499 will be fixed
                                'densenet-161-tf',
                                'se-resnet-101',
                                'se-resnet-50',
                                'se-resnet-152',
                                'drn-d-38',
                                'se-inception',
                                'densenet-169',
                                'se-resnext-50',
                                'ssd512',
                                'Sphereface',
                                'densenet-121',
                                'densenet-161',
                                'ssd300',
                                'densenet-201',
                                'se-resnext-101',
                                'mobilenet-ssd',
                                )

    supported_topologies = OMZTopologyModel.query \
        .filter(
        and_(
            OMZTopologyModel.task_type != TaskEnum.generic,
            OMZTopologyModel.name.notin_(not_supported_topologies),
        )
    ).all()

    semantic_segmentation_necessary_postprocessing_type = ('encode_segmentation_mask',)
    aggregated_models = []
    for model in supported_topologies:
        precisions = [p.precision.value for p in model.precisions]

        # Filter rule #2: Show any precision except INT1
        if set(precisions) & {ModelPrecisionEnum.i1.value}:
            continue

        # Filter rule #3: Show VOC Segmentation-compatible Semantic Segmentation models only "
        if model.task_type == TaskEnum.semantic_segmentation:
            advanced_configuration = json.loads(model.advanced_configuration)
            postprocessing = advanced_configuration['postprocessing']
            is_supported = list(filter(
                lambda postprocessing: postprocessing['type'] in semantic_segmentation_necessary_postprocessing_type,
                postprocessing
            ))
            if not is_supported:
                continue

        if model.name in not_supported_topologies:
            continue

        share_same_name = [x for x in aggregated_models if model.name == x['name']]

        if not share_same_name:
            model_data = {
                **model.json(),
                'precision': precisions,
                'isAvailable': is_model_available(model)
            }
            aggregated_models.append(model_data)
            continue

        existing_json_model = share_same_name[0]

        for precision_value in precisions:
            if precision_value not in existing_json_model['precision']:
                existing_json_model['precision'].append(precision_value)

    return aggregated_models
