"""
 OpenVINO DL Workbench
 Accuracy checker's configuration registry

 Copyright (c) 2018-2019 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
from wb.main.accuracy_utils.yml_abstractions.typed_parameter import Adapter
from wb.main.accuracy_utils.yml_templates.registry import register_task_method_adapter
from wb.main.enumerates import TaskMethodEnum, YoloAnchorMasksEnum
from model_analyzer.constants import YoloAnchors


@register_task_method_adapter(TaskMethodEnum.ssd)
def get_ssd_adapter() -> Adapter:
    return Adapter(type='ssd', parameters={})


@register_task_method_adapter(TaskMethodEnum.classificator)
def get_classification_adapter() -> Adapter:
    return Adapter(type='classification', parameters={})


def format_yolo_anchors(anchors: YoloAnchors) -> str:
    return ','.join(str(anchor) for anchor in list(anchors.value))


@register_task_method_adapter(TaskMethodEnum.yolo_v2)
def get_yolo_v2_adapter() -> Adapter:
    return Adapter(type='yolo_v2', parameters={
        'anchors': format_yolo_anchors(YoloAnchors.yolo_v2)
    })


@register_task_method_adapter(TaskMethodEnum.tiny_yolo_v2)
def get_tiny_yolo_v2_adapter() -> Adapter:
    return Adapter(type='yolo_v2', parameters={
        'anchors': format_yolo_anchors(YoloAnchors.tiny_yolo_v2)
    })


@register_task_method_adapter(TaskMethodEnum.yolo_v3)
def get_yolo_v3_adapter() -> Adapter:
    return Adapter(type='yolo_v3', parameters={
        'anchors': format_yolo_anchors(YoloAnchors.yolo_v3),
        'anchor_masks': YoloAnchorMasksEnum.yolo_v3.value,
    })


@register_task_method_adapter(TaskMethodEnum.yolo_v4)
def get_yolo_v4_adapter() -> Adapter:
    return Adapter(type='yolo_v3', parameters={
        'anchors': format_yolo_anchors(YoloAnchors.yolo_v4),
        'anchor_masks': YoloAnchorMasksEnum.yolo_v4.value,
    })


@register_task_method_adapter(TaskMethodEnum.tiny_yolo_v3_v4)
def get_tiny_yolo_v3_v4_adapter() -> Adapter:
    return Adapter(type='yolo_v3', parameters={
        'anchors': format_yolo_anchors(YoloAnchors.tiny_yolo_v3_v4),
        'anchor_masks': YoloAnchorMasksEnum.tiny_yolo_v3_v4.value,
    })


@register_task_method_adapter(TaskMethodEnum.mask_rcnn)
def get_mask_rcnn_adapter() -> Adapter:
    return Adapter(type='mask_rcnn', parameters={
        'raw_masks_out': '',
        'detection_out': '',
        'boxes_out': '',
        'classes_out': '',
        'scores_out': ''
    })


@register_task_method_adapter(TaskMethodEnum.segmentation)
def get_segmentation_adapter() -> Adapter:
    return Adapter(type='segmentation', parameters={})


@register_task_method_adapter(TaskMethodEnum.inpainting)
def get_inpainting_adapter() -> Adapter:
    return Adapter(type='inpainting', parameters={})


@register_task_method_adapter(TaskMethodEnum.style_transfer)
def get_style_transfer_adapter() -> Adapter:
    return Adapter(type='style_transfer', parameters={})


@register_task_method_adapter(TaskMethodEnum.super_resolution)
def get_super_resolution_adapter() -> Adapter:
    return Adapter(type='super_resolution', parameters={})


@register_task_method_adapter(TaskMethodEnum.face_recognition)
def get_face_recognition_adapter() -> Adapter:
    return Adapter(type='reid', parameters={})


@register_task_method_adapter(TaskMethodEnum.landmark_detection)
def get_landmark_detection_adapter() -> Adapter:
    return Adapter(type='landmarks_regression', parameters={})


@register_task_method_adapter(TaskMethodEnum.custom)
def get_generic_adapter() -> Adapter:
    return Adapter(type='REQUIRED', parameters={})
