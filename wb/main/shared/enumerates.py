"""
 OpenVINO DL Workbench
 Shared enumerates for both local and remote usage and scripts

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

    @classmethod
    def get_value(cls, value: str):
        if value in cls(value):
            return cls(value)
        return None

    def is_nlp(self) -> bool:
        return self in {self.csv, }
