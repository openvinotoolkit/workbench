"""
 OpenVINO DL Workbench
 Classes for processing annotations to dataset items

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

try:
    from wb.main.scripts.dataset_annotator.dataset_item_creator.base_dataset_item_creator import \
        DatasetItemCreatorFactory
    from wb.main.scripts.dataset_annotator.dataset_item_creator.classification_dataset_item_creator import \
        ClassificationDatasetItemCreator
    from wb.main.scripts.dataset_annotator.dataset_item_creator.detection_dataset_item_creator import \
        DetectionDatasetItemCreator
    from wb.main.scripts.dataset_annotator.dataset_item_creator.instance_segmentation_dataset_item_creator import \
        InstanceSegmentationDatasetItemCreator
    from wb.main.scripts.dataset_annotator.dataset_item_creator.segmentation_dataset_item_creator import \
        SegmentationDatasetItemCreator
except ImportError:
    from .base_dataset_item_creator import DatasetItemCreatorFactory
    from .classification_dataset_item_creator import ClassificationDatasetItemCreator
    from .detection_dataset_item_creator import DetectionDatasetItemCreator
    from .instance_segmentation_dataset_item_creator import InstanceSegmentationDatasetItemCreator
    from .segmentation_dataset_item_creator import SegmentationDatasetItemCreator
