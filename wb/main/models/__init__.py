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

# in order for database migrations to detect models schema changes all models should be imported explicitly

from wb.main.models.accuracy_analysis import *
from wb.main.models.accuracy_model import AccuracyJobsModel
from wb.main.models.analyze_model_input_shape_job_model import AnalyzeModelInputShapeJobModel
from wb.main.models.apply_model_layout_model import ApplyModelLayoutJobModel
from wb.main.models.artifacts_model import ArtifactsModel
from wb.main.models.base_model import BaseModel
from wb.main.models.cloud_bundle_model import CloudBundleModel
from wb.main.models.convert_dataset_jobs_model import ConvertDatasetJobsModel
from wb.main.models.convert_keras_job_model import ConvertKerasJobModel
from wb.main.models.cpu_info_model import CPUInfoModel
from wb.main.models.create_accuracy_bundle_job_model import CreateAccuracyBundleJobModel
from wb.main.models.create_accuracy_scripts_job_model import CreateAccuracyScriptsJobModel
from wb.main.models.create_int8_calibration_scripts_job_model import CreateInt8CalibrationScriptsJobModel
from wb.main.models.create_int8_calibration_bundle_job_model import CreateInt8CalibrationBundleJobModel
from wb.main.models.create_profiling_bundle_job_model import CreateProfilingBundleJobModel
from wb.main.models.create_profiling_scripts_job_model import CreateProfilingScriptsJobModel
from wb.main.models.create_reshape_model_scripts_model import CreateReshapeModelScriptsJobModel
from wb.main.models.create_setup_bundle_job_model import CreateSetupBundleJobModel
from wb.main.models.dataset_augmentation_job_model import DatasetAugmentationJobModel
from wb.main.models.dataset_tasks_model import DatasetTasksModel
from wb.main.models.datasets_model import DatasetsModel, DatasetJobData, TextDatasetJobData
from wb.main.models.dependency_model import DependencyModel
from wb.main.models.deployment_bundle_config_model import DeploymentBundleConfigModel, DeploymentTargetsModel
from wb.main.models.dev_cloud_target_model import DevCloudTargetModel
from wb.main.models.devices_model import DevicesModel
from wb.main.models.download_configs_model import ModelDownloadConfigsModel
from wb.main.models.download_log_job_model import DownloadLogJobModel
from wb.main.models.downloadable_artifacts_model import DownloadableArtifactsModel
from wb.main.models.enumerates import (STATUS_ENUM_SCHEMA, TASK_ENUM_SCHEMA, TASK_METHOD_ENUM_SCHEMA,
                                       DATASET_TYPES_ENUM_SCHEMA, OPTIMIZATION_TYPE_ENUM_SCHEMA,
                                       SUPPORTED_FRAMEWORKS_ENUM_SCHEMA, MODEL_PRECISION_ENUM_SCHEMA,
                                       ARTIFACT_TYPES_ENUM_SCHEMA, QUANTIZATION_ALGORITHM_ENUM_SCHEMA,
                                       QUANTIZATION_ALGORITHM_PRESET_ENUM_SCHEMA, MODEL_SOURCE_ENUM_SCHEMA,
                                       DEPLOYMENT_TARGET_ENUM_SCHEMA, DEPLOYMENT_PACKAGES_SIZE_ENUM_SCHEMA,
                                       TARGET_TYPE_ENUM_SCHEMA, PIPELINE_TYPE_ENUM_SCHEMA, PIPELINE_STAGE_ENUM_SCHEMA,
                                       CPU_PLATFORM_TYPE_ENUM_ENUM_SCHEMA)
from wb.main.models.environment_model import EnvironmentModel
from wb.main.models.export_project_model import ExportProjectJobModel
from wb.main.models.extract_dataset_jobs_model import ExtractDatasetJobsModel, ExtractTextDatasetJobsModel
from wb.main.models.files_model import FilesModel, FileMetaData
from wb.main.models.get_devices_job_model import GetDevicesJobModel
from wb.main.models.get_system_resources_job_model import GetSystemResourcesJobModel
from wb.main.models.huggingface.import_huggingface_model_job_model import ImportHuggingfaceJobModel
from wb.main.models.inference_report_export_job_model import InferenceReportExportJobModel
from wb.main.models.inference_test_image_job_model import InferenceTestImageJobModel
from wb.main.models.inference_test_image_model import InferenceTestImageModel
from wb.main.models.int8_calibration_job_model import Int8CalibrationJobData
from wb.main.models.int8_calibration_job_model import Int8CalibrationJobModel
from wb.main.models.job_execution_details_model import JobExecutionDetailsModel
from wb.main.models.jobs_model import JobsModel
from wb.main.models.jupyter_notebook_model import JupyterNotebookModel
from wb.main.models.local_target_model import LocalTargetModel
from wb.main.models.model_optimizer_job_model import ModelOptimizerJobModel
from wb.main.models.model_optimizer_scan_job_model import ModelOptimizerScanJobModel
from wb.main.models.model_precisions_model import ModelPrecisionsModel
from wb.main.models.model_shape_configuration_model import ModelShapeConfigurationModel
from wb.main.models.omz_model_convert_job_model import OMZModelConvertJobModel
from wb.main.models.omz_model_download_job_model import OMZModelDownloadJobModel
from wb.main.models.omz_model_move_job_model import OMZModelMoveJobModel
from wb.main.models.omz_topology_model import OMZTopologyModel
from wb.main.models.parse_dev_cloud_accuracy_result_job_model import ParseDevCloudAccuracyResultJobModel
from wb.main.models.parse_dev_cloud_dataset_annotation_result_job_model import \
    ParseDevCloudDatasetAnnotationResultJobModel
from wb.main.models.parse_dev_cloud_int8_calibration_result_job_model import \
    ParseDevCloudInt8CalibrationResultJobModel, ParseDevCloudInt8CalibrationResultJobData
from wb.main.models.parse_dev_cloud_per_tensor_result_job_model import ParseDevCloudPerTensorResultJobModel
from wb.main.models.parse_dev_cloud_profiling_result_job_model import ParseDevCloudProfilingResultJobModel
from wb.main.models.parse_dev_cloud_result_job_model import ParseDevCloudResultJobModel
from wb.main.models.pipeline_model import PipelineModel
from wb.main.models.profiling_model import ProfilingJobModel
from wb.main.models.project_accuracy_model import ProjectAccuracyModel
from wb.main.models.project_report_export_job_model import ProjectReportExportJobModel
from wb.main.models.projects_model import ProjectsModel
from wb.main.models.proxy_model import ProxyModel
from wb.main.models.recognize_dataset_jobs_model import RecognizeDatasetJobsModel
from wb.main.models.remote_target_model import RemoteTargetModel
from wb.main.models.reshape_model_job_model import ReshapeModelJobModel
from wb.main.models.setup_environment_job_model import SetupEnvironmentJobModel
from wb.main.models.setup_target_jobs_model import SetupTargetJobsModel
from wb.main.models.shared_artifact_model import SharedArtifactModel
from wb.main.models.single_inference_info_model import SingleInferenceInfoModel
from wb.main.models.system_resources_model import SystemResourcesModel
from wb.main.models.target_model import TargetModel
from wb.main.models.tokenizer import *
from wb.main.models.topologies_metadata_model import TopologiesMetaDataModel
from wb.main.models.topologies_model import TopologiesModel
from wb.main.models.topology_analysis_jobs_model import TopologyAnalysisJobsModel
from wb.main.models.trigger_dev_cloud_job_model import TriggerDevCloudJobModel, TriggerDevCloudJobData
from wb.main.models.upload_artifact_to_target_job_model import UploadArtifactToTargetJobModel
from wb.main.models.user_metadata_model import UserMetadataModel
from wb.main.models.users_model import UsersModel
from wb.main.models.validate_dataset_jobs_model import ValidateDatasetJobsModel, ValidateTextDatasetJobsModel
from wb.main.models.wait_dataset_upload_jobs_model import WaitDatasetUploadJobsModel
from wb.main.models.wait_model_upload_job_model import WaitModelUploadJobModel
from wb.main.models.wb_information_model import WBInfoModel
from wb.main.models.workbench_session import WorkbenchSession

UNERASABLE_TABLES = (WorkbenchSession.__tablename__,
                     WBInfoModel.__tablename__,
                     UsersModel.__tablename__,
                     UserMetadataModel.__tablename__,
                     'alembic_version')
