"""
 OpenVINO DL Workbench
 Shared enumerates for both local and remote usage and scripts

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
import enum


class TaskEnum(enum.Enum):
    classification = 'classification'
    object_detection = 'object_detection'
    instance_segmentation = 'instance_segmentation'
    semantic_segmentation = 'semantic_segmentation'
    inpainting = 'inpainting'
    style_transfer = 'style_transfer'
    super_resolution = 'super_resolution'
    face_recognition = 'face_recognition'
    landmark_detection = 'landmark_detection'
    generic = 'generic'
    custom = 'custom'

    # text
    text_classification = 'text_classification'
    textual_entailment = 'textual_entailment'

    @classmethod
    def has_value(cls, value: str) -> bool:
        return any(value == item.value for item in cls)


class DatasetTypesEnum(enum.Enum):
    imagenet = 'imagenet'
    imagenet_txt = 'imagenet_txt'
    voc = 'voc'
    voc_segmentation = 'voc_segmentation'
    coco = 'coco'
    common_semantic_segmentation = 'common_semantic_segmentation'
    common_super_resolution = 'common_super_resolution'
    lfw = 'lfw'
    vgg_face2 = 'vgg_face2'
    wider_face = 'wider_face'
    open_images = 'open_images'
    cityscapes = 'cityscapes'
    not_annotated = 'not_annotated'

    # text
    csv = 'csv'

    def is_nlp(self):
        return self in {self.csv, }
