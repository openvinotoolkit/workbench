"""
 OpenVINO DL Workbench
 Import Classes for ORM models

 Copyright (c) 2018 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""

# in order for database migrations detect models schema changes all models should be imported explicitly

from wb.main.models.accuracy_analysis.accuracy_report_model import AccuracyReportModel
from wb.main.models.accuracy_analysis.annotate_dataset_job_model import AnnotateDatasetJobModel
from wb.main.models.accuracy_analysis.create_annotate_dataset_scripts_job_model import \
    CreateAnnotateDatasetScriptsJobModel
from wb.main.models.accuracy_analysis.classification_accuracy_report_entity_model import \
    ClassificationAccuracyReportEntityModel
from wb.main.models.accuracy_analysis.create_per_tensor_bundle_job_model import CreatePerTensorBundleJobModel
from wb.main.models.accuracy_analysis.create_per_tensor_scripts_job_model import CreatePerTensorScriptsJobModel
from wb.main.models.accuracy_analysis.detection_accuracy_report_entity_model import DetectionAccuracyReportEntityModel, \
    AggregatedDetectionAccuracyReportQueryModel
from wb.main.models.accuracy_analysis.instance_segmentation_accuracy_report_entity_model import \
    InstanceSegmentationAccuracyReportEntityModel, AggregatedInstanceSegmentationAccuracyReportQueryModel
from wb.main.models.accuracy_analysis.per_tensor_report_job_model import PerTensorReportJobsModel
from wb.main.models.accuracy_analysis.semantic_segmentation_accuracy_report_entity_model import \
    SemanticSegmentationAccuracyReportEntityModel, AggregatedSemanticSegmentationAccuracyReportQueryModel
from wb.main.models.accuracy_analysis.tensor_distance_accuracy_report_entity_model import \
    TensorDistanceAccuracyReportEntityModel
from wb.main.models.accuracy_analysis.tensor_distance_accuracy_report_model import TensorDistanceAccuracyReportModel
