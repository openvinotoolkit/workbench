"""
 OpenVINO DL Workbench
 Import Classes for ORM models

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
