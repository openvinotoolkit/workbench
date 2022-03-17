"""
 OpenVINO DL Workbench
 Some utilitarian functions and variables for database

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

from sqlalchemy import Enum as EnumSchema

from wb.main.enumerates import (CPUPlatformTypeEnum, PipelineStageEnum, PipelineTypeEnum, TargetTypeEnum,
                                DeploymentPackageSizesEnum, DeploymentTargetEnum, ModelSourceEnum,
                                QuantizationAlgorithmPresetEnum, QuantizationAlgorithmEnum, ArtifactTypesEnum,
                                ModelPrecisionEnum, SupportedFrameworksEnum, OptimizationTypesEnum, TaskMethodEnum,
                                StatusEnum, DevCloudRemoteJobTypeEnum, TargetOSEnum, TestInferVisualizationTypesEnum,
                                AccuracyReportTypeEnum, CSVDatasetSeparatorEnum, TokenizerTypeEnum, ModelDomainEnum)
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
