"""
 OpenVINO DL Workbench
 Classes for processing annotations to dataset items

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
