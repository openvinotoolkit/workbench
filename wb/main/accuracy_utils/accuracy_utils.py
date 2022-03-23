"""
 OpenVINO DL Workbench
 Utils to prepare templates for accuracy checker

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
import re
from typing import Optional, Dict, List

from openvino.runtime import Core, Model as OVModel
# pylint: disable=import-error,no-name-in-module
from openvino.tools.accuracy_checker.evaluators import ModelEvaluator

from wb.main.accuracy_utils.yml_abstractions import (Adapter, Model, Launcher, Dataset, Preprocessing, Postprocessing,
                                                     Metric)
from wb.main.accuracy_utils.yml_templates import ConfigRegistry
from wb.main.enumerates import ModelSourceEnum, TaskMethodEnum
from wb.main.models import DatasetsModel, DevicesModel, TopologiesModel
from wb.main.shared.enumerates import TaskEnum


def construct_accuracy_tool_config(
        topology_record: TopologiesModel,
        dataset_record: DatasetsModel,
        device: DevicesModel) -> Model:
    name = topology_record.name
    mo_params = load_json_param(topology_record.analysis_job.mo_params)
    topology_type = topology_record.meta.topology_type
    advanced_configuration = load_json_param(topology_record.meta.advanced_configuration)
    adapter_config = load_json_param(topology_record.meta.advanced_configuration).get('adapterConfiguration')

    model_xml, model_weights = topology_record.files_paths
    launcher_config = Launcher(
        adapter=setup_adapter(topology_record, topology_type, adapter_config),
        device=device.type,
        model=model_xml,
        weights=model_weights,
        inputs=combine_input_info(topology_record, topology_type, adapter_config),
    )

    dataset_adapter = ConfigRegistry.dataset_recognizer_registry[dataset_record.dataset_type].provide_adapter(
        topology_record.meta.task_type,
        dataset_record.path,
        advanced_configuration.get('annotationConversion')
    )
    annotation_object = dataset_adapter.to_annotation()
    dataset_config = Dataset(
        data_source=annotation_object['data_source'],
        annotation=annotation_object['annotation'],
        preprocessing=setup_preprocessing(topology_type, mo_params, annotation_object['annotation'].to_dict(),
                                          advanced_configuration['preprocessing']),
        postprocessing=setup_postprocessing(topology_type, annotation_object['annotation'].to_dict(),
                                            advanced_configuration['postprocessing']),
        metrics=Metric.from_list(advanced_configuration['metric'])
    )
    dataset_config.set_data_reader(annotation_object.get('reader'))
    dataset_config.set_extra_source(annotation_object.get('additional_data_source'))

    return Model(launcher_config, dataset_config, name)


def construct_auto_annotated_dataset_conversion(task_type: TaskEnum, dataset: DatasetsModel) -> dict:
    annotation = ConfigRegistry.dataset_recognizer_registry[dataset.dataset_type].provide_adapter(
        task_type,
        dataset.path,
        None
    ).to_annotation()

    result = {
        'data_source': annotation['data_source'],
        'annotation_conversion': annotation['annotation'].to_dict()['annotation_conversion']
    }

    if 'additional_data_source' in annotation:
        result['additional_data_source'] = annotation['additional_data_source']

    return result


def construct_visualization_config(topology_record: TopologiesModel,
                                   device: DevicesModel,
                                   visualization_configuration: dict = None, ) -> Model:
    name = topology_record.name
    mo_params = load_json_param(topology_record.analysis_job.mo_params)
    visualization_configuration = visualization_configuration or topology_record.meta.visualization_configuration_json()
    task_method = TaskMethodEnum(visualization_configuration.get('taskMethod'))
    adapter_config = visualization_configuration.get('adapterConfiguration')

    model_xml, model_weights = topology_record.files_paths
    launcher_config = Launcher(
        adapter=setup_adapter(topology_record, task_method, adapter_config),
        device=device.type,
        model=model_xml,
        weights=model_weights,
        inputs=combine_input_info(topology_record, task_method, adapter_config),
    )

    dataset_config = Dataset(
        annotation=None,
        data_source=None,
        preprocessing=setup_preprocessing(task_method, mo_params, {},
                                          visualization_configuration['preprocessing']),
        postprocessing=setup_postprocessing(task_method, {},
                                            visualization_configuration['postprocessing']),
        metrics=None
    )

    return Model(launcher_config, dataset_config, name)


def is_visualization_config_valid(topology_record: TopologiesModel, device: DevicesModel,
                                  visualization_configuration: dict) -> bool:
    config = construct_visualization_config(topology_record, device, visualization_configuration).to_dict()
    model_evaluator = ModelEvaluator.from_configs(config['models'][0], delayed_annotation_loading=True)
    errors = model_evaluator.validate_config(config, delayed_annotation_loading=True)
    return not bool(errors)


def construct_accuracy_config_template(
        topology_record: TopologiesModel,
        dataset_record: DatasetsModel,
        device: DevicesModel) -> Model:
    task_type = TaskEnum.custom
    task_method = TaskMethodEnum.custom

    model_xml, model_weights = topology_record.files_paths
    launcher_config = Launcher(
        adapter=setup_adapter(topology_record, task_method, {}),
        device=device.type,
        model=model_xml,
        weights=model_weights,
        inputs=combine_input_info(topology_record, task_method, {}),
    )

    dataset_adapter = ConfigRegistry.dataset_recognizer_registry[dataset_record.dataset_type].provide_adapter(
        task_type,
        dataset_record.path,
    )

    annotation_object = dataset_adapter.to_annotation()

    dataset_config = Dataset(
        data_source=annotation_object['data_source'],
        annotation=annotation_object['annotation'],
        preprocessing=setup_preprocessing(task_method, {}, {}, [{'type': 'REQUIRED'}]),
        postprocessing=setup_postprocessing(task_method, {}, [{'type': 'REQUIRED'}]),
        metrics=Metric.from_list([{'type': 'REQUIRED'}])
    )

    return Model(launcher_config, dataset_config, topology_record.name)


def setup_adapter(topology_record: TopologiesModel,
                  topology_type: TaskMethodEnum = TaskMethodEnum.custom,
                  adapter_config: dict = None) -> Adapter:
    if adapter_config is None:
        adapter_config = {}

    if topology_record.source == ModelSourceEnum.omz:
        return setup_omz_adapter(topology_record, topology_type, adapter_config)
    return setup_original_adapter(topology_record, topology_type, adapter_config)


def setup_omz_adapter(unused_topology_record: TopologiesModel,
                      topology_type: TaskMethodEnum,
                      adapter_config: dict = None) -> Adapter:
    adapter = ConfigRegistry.task_method_registry[topology_type]()
    omz_adapter = adapter_config.get('adapter', {})
    omz_adapter.pop('type', None)
    adapter.parameters = {}
    adapter.set_params(omz_adapter)

    return adapter


def setup_original_adapter(topology_record: TopologiesModel,
                           topology_type: TaskMethodEnum = TaskMethodEnum.custom,
                           adapter_config: dict = None) -> Adapter:
    mo_params = load_json_param(topology_record.analysis_job.mo_params)
    topology_specifics = load_json_param(topology_record.analysis_job.topology_specific)

    adapter = ConfigRegistry.task_method_registry[topology_type]()
    if topology_type == TaskMethodEnum.mask_rcnn:
        adapter.parameters = {}
        adapter.set_params(adapter_config.get('outputs', []))

    if topology_type in [TaskMethodEnum.yolo_v2, TaskMethodEnum.tiny_yolo_v2]:
        adapter.set_params(topology_specifics.get('yolo_params', {}))

    if topology_type in [TaskMethodEnum.yolo_v3, TaskMethodEnum.yolo_v4, TaskMethodEnum.tiny_yolo_v3_v4]:
        try:
            yolo_params = get_yolo_v3_adapter_params(topology_record, topology_type)
            outputs = yolo_params['outputs']
            output_format = yolo_params['output_format']

            adapter.set_params({'output_format': output_format})
        except Exception:
            outputs = topology_specifics.get('yolo_outputs', [])

        adapter.set_params({'outputs': outputs})
        adapter.set_params({'raw_output': topology_specifics.get('raw_output', False)})
        if 'classes' in adapter_config:
            adapter.set_params({'classes': adapter_config.get('classes')})

    if topology_type == TaskMethodEnum.super_resolution:
        adapter.set_params({
            'reverse_channels': mo_params.get('reverse_input_channels', False),
            'mean': parse_super_res_normalization(mo_params['mean_values'], topology_specifics) or 0,
            'std': parse_super_res_normalization(mo_params['scale_values'], topology_specifics) or 1
        })

    return adapter


def get_yolo_v3_adapter_params(topology_record: TopologiesModel, topology_type: TaskMethodEnum) -> dict:
    xml_path, bin_path = topology_record.files_paths

    model = Core().read_model(xml_path, weights=bin_path)

    return {
        'outputs': get_ordered_yolo_v3_outputs(model, topology_type),
        'output_format': get_yolo_v3_output_format(model)
    }


def get_yolo_v3_output_format(model: OVModel) -> str:
    """
    Return yolo v3 output format 'BHW' | 'HWB'
    Current implementation rely on square output.
    Example: 1, 13, 13, 186 or 1, 186, 13, 13
             1,  h,  w,   b or 1,   b,  h,  w
    """
    output_shape = model.outputs[0].shape

    if output_shape[1] == output_shape[2]:
        return 'HWB'
    elif output_shape[2] == output_shape[3]:
        return 'BHW'
    else:
        raise RuntimeError(f'Yolo output with non square shape {output_shape} is not supported')


def get_ordered_yolo_v3_outputs(model: OVModel, topology_type: TaskMethodEnum) -> List[str]:
    """
    Yolo outputs order should be aligned with anchor masks order
    Current implementation rely on square output.
    Example: 1, 13, 13, 186 or 1, 186, 13, 13
             1,  h,  w,   b or 1,   b,  h,  w
    """
    reverse_map = {
        TaskMethodEnum.yolo_v3: False,
        TaskMethodEnum.yolo_v4: True,
        TaskMethodEnum.tiny_yolo_v3_v4: False,
    }

    def get_output_cell_side(output) -> int:
        # shape is:
        # 1, 13, 13, 186 or 1, 186, 13, 13
        # 1,  h,  w,   b or 1,   b,  h,  w
        return output.shape[2]

    sorted_outputs = sorted(model.outputs, key=get_output_cell_side, reverse=reverse_map[topology_type])
    return [x.any_name for x in sorted_outputs]


def combine_input_info(topology_record: TopologiesModel,
                       topology_type: TaskMethodEnum = TaskMethodEnum.custom,
                       adapter_config: dict = None) -> Optional[list]:
    if adapter_config is None:
        adapter_config = {}
    topology_specifics = load_json_param(topology_record.analysis_job.topology_specific)
    meta_inputs = topology_record.meta.inputs

    inputs = []
    if meta_inputs:
        inputs.extend(json.loads(meta_inputs))

    if topology_type == TaskMethodEnum.mask_rcnn and 'image_info_input' in adapter_config:
        inputs.append({'name': adapter_config['image_info_input'], 'type': 'IMAGE_INFO'})

    if topology_type == TaskMethodEnum.inpainting and 'inpainting' in topology_specifics:
        inputs = fill_inpainting_inputs(topology_specifics['inpainting'])

    if topology_type == TaskMethodEnum.super_resolution and 'super_resolution' in topology_specifics:
        inputs = fill_super_resolution_inputs(topology_specifics['super_resolution'])
    return inputs


def fill_inpainting_inputs(inputs: Dict[str, str]) -> list:
    return [{
        'name': inputs['image'],
        'type': 'INPUT',
        'value': '.*image'
    },
        {
            'name': inputs['mask'],
            'type': 'INPUT',
            'value': '.*mask'
        }]


def fill_super_resolution_inputs(inputs: Dict[str, str]) -> list:
    result = [{
        'name': inputs['low-res'],
        'type': 'INPUT',
        'value': '.*LR/*'
    }]
    if 'upsample' in inputs:
        result.append({
            'name': inputs['upsample'],
            'type': 'INPUT',
            'value': '.*upsampled/*'
        })
    return result


def setup_preprocessing(topology_type: TaskMethodEnum,
                        mo_params: Dict[str, str],
                        annotation_config: Dict[str, str],
                        preprocessing_config: list) -> list:
    if topology_type == TaskMethodEnum.inpainting:
        remove_custom_mask(preprocessing_config)
    if topology_type == TaskMethodEnum.super_resolution:
        check_grayscale(mo_params['input_shape'], preprocessing_config)
    if topology_type == TaskMethodEnum.face_recognition \
            and 'landmarks_file' in annotation_config:
        add_alignment(preprocessing_config)
    if topology_type == TaskMethodEnum.landmark_detection \
            and 'bbox_csv_file' in annotation_config:
        add_crop_rect(preprocessing_config)
    return Preprocessing.from_list(preprocessing_config)


def remove_custom_mask(preprocessing_config: list):
    for item in preprocessing_config:
        if item.get('type') == 'custom_mask':
            del preprocessing_config[preprocessing_config.index(item)]
            preprocessing_config.append({
                'type': 'rect_mask',
                'dst_width': 100,
                'dst_height': 100
            })


def add_alignment(preprocessing_config: list):
    preprocessing_config.append({
        'type': 'point_alignment',
        'size': 400
    })


def add_crop_rect(preprocessing_config: list):
    preprocessing_config.append({'type': 'crop_rect'})


def setup_postprocessing(topology_type: TaskMethodEnum,
                         annotation_config: Dict[str, str],
                         postprocessing_config: list) -> list:
    if topology_type not in [TaskMethodEnum.super_resolution,
                             TaskMethodEnum.style_transfer,
                             TaskMethodEnum.inpainting]:
        return Postprocessing.from_list(postprocessing_config)
    remove_unsupported_params(postprocessing_config)
    if 'resize' not in [param['type'] for param in postprocessing_config]:
        add_resize(postprocessing_config)
    if topology_type == TaskMethodEnum.landmark_detection \
            and 'bbox_csv_file' in annotation_config:
        set_annotation_rect(postprocessing_config)
    return Postprocessing.from_list(postprocessing_config)


def remove_unsupported_params(postprocessing_config: list):
    for item in postprocessing_config:
        if item.get('type') in ['resize_inpainting', 'resize_style_transfer', 'resize_super_resolution']:
            del postprocessing_config[postprocessing_config.index(item)]


def add_resize(postprocessing_config: list):
    postprocessing_config.append({'type': 'resize', 'apply_to': 'prediction'})


def set_annotation_rect(postprocessing_config: list):
    for item in postprocessing_config:
        if item.get('type') == 'normalize_landmarks_points':
            del postprocessing_config[postprocessing_config.index(item)]
            postprocessing_config.append({
                'type': 'normalize_landmarks_points',
                'use_annotation_rect': True
            })


def parse_super_res_normalization(mo_param: str,
                                  specifics: Dict[str, str]) -> Optional[float]:
    if not mo_param:
        return None
    # params are specified per layer, i.e. 'layer1(param), layer2(param)' etc.
    params = re.split(r'(?<=\)),', mo_param)
    for param in params:
        # split into layer name and the param itself
        # i.e. 'layer(param)' = ['layer', 'param']
        breakdown = re.split(r'[(,)]', param)[:-1]
        if breakdown[0] == specifics['super_resolution']['low-res']:
            # the param itself can either be single number or a separate number for each channel
            return float(breakdown[1]) if len(breakdown) == 2 else [float(i) for i in breakdown[1:]]
    return None


def check_grayscale(input_shapes: str,
                    preprocessing_config: list):
    if 'bgr_to_gray' not in [param['type'] for param in preprocessing_config]:
        inputs = re.split(r'(?<=\)),', input_shapes)
        for entry in inputs:
            shapes = re.split(r'[(,)]', entry)[1:-1]
            if len(shapes) == 4 and shapes[1:2] == ['1']:
                preprocessing_config.append({'type': 'bgr_to_gray'})
                break


def load_json_param(param: str) -> Optional[dict]:
    return json.loads(param) if param else None
