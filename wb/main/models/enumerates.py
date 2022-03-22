"""
 OpenVINO DL Workbench
 Some utilitarian functions and variables for database

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

from sqlalchemy import Enum as EnumSchema

from wb.main.enumerates import (CPUPlatformTypeEnum, PipelineStageEnum, PipelineTypeEnum, TargetTypeEnum,
                                DeploymentPackageSizesEnum, DeploymentTargetEnum, ModelSourceEnum,
                                QuantizationAlgorithmPresetEnum, QuantizationAlgorithmEnum, ArtifactTypesEnum,
                                ModelPrecisionEnum, SupportedFrameworksEnum, OptimizationTypesEnum, TaskMethodEnum,
                                StatusEnum, DevCloudRemoteJobTypeEnum, TargetOSEnum, TestInferVisualizationTypesEnum,
                                AccuracyReportTypeEnum, CSVDatasetSeparatorEnum, TokenizerTypeEnum, ModelDomainEnum,
                                DevCloudAPIVersionEnum)
from wb.main.shared.enumerates import TaskEnum, DatasetTypesEnum

STATUS_ENUM_SCHEMA = EnumSchema(StatusEnum)

TASK_ENUM_SCHEMA = EnumSchema(TaskEnum)

TASK_METHOD_ENUM_SCHEMA = EnumSchema(TaskMethodEnum)

DATASET_TYPES_ENUM_SCHEMA = EnumSchema(DatasetTypesEnum)

OPTIMIZATION_TYPE_ENUM_SCHEMA = EnumSchema(OptimizationTypesEnum)

SUPPORTED_FRAMEWORKS_ENUM_SCHEMA = EnumSchema(SupportedFrameworksEnum)

MODEL_DOMAIN_ENUM_SCHEMA = EnumSchema(ModelDomainEnum)

MODEL_PRECISION_ENUM_SCHEMA = EnumSchema(ModelPrecisionEnum)

ARTIFACT_TYPES_ENUM_SCHEMA = EnumSchema(ArtifactTypesEnum)

QUANTIZATION_ALGORITHM_ENUM_SCHEMA = EnumSchema(QuantizationAlgorithmEnum)

QUANTIZATION_ALGORITHM_PRESET_ENUM_SCHEMA = EnumSchema(QuantizationAlgorithmPresetEnum)

MODEL_SOURCE_ENUM_SCHEMA = EnumSchema(ModelSourceEnum)

TARGET_OS_ENUM_SCHEMA = EnumSchema(TargetOSEnum)

DEPLOYMENT_TARGET_ENUM_SCHEMA = EnumSchema(DeploymentTargetEnum)

DEPLOYMENT_PACKAGES_SIZE_ENUM_SCHEMA = EnumSchema(DeploymentPackageSizesEnum)

TARGET_TYPE_ENUM_SCHEMA = EnumSchema(TargetTypeEnum)

PIPELINE_TYPE_ENUM_SCHEMA = EnumSchema(PipelineTypeEnum)

PIPELINE_STAGE_ENUM_SCHEMA = EnumSchema(PipelineStageEnum)

DEV_CLOUD_REMOTE_JOB_TYPE_ENUM_SCHEMA = EnumSchema(DevCloudRemoteJobTypeEnum)

CPU_PLATFORM_TYPE_ENUM_ENUM_SCHEMA = EnumSchema(CPUPlatformTypeEnum)

TEST_INFER_VISUALIZATION_TYPES_ENUM_SCHEMA = EnumSchema(TestInferVisualizationTypesEnum)

ACCURACY_REPORT_TYPE_ENUM = EnumSchema(AccuracyReportTypeEnum)

CSV_SEPARATOR_TYPE_ENUM_SCHEMA = EnumSchema(CSVDatasetSeparatorEnum)

TOKENIZER_TYPE_ENUM_SCHEMA = EnumSchema(TokenizerTypeEnum)
