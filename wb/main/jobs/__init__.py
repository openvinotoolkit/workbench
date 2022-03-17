"""
 OpenVINO DL Workbench
 Import Jobs Classes

 Copyright (c) 2020 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
# in order for job factory detect all jobs classes each job class should be imported explicitly
from wb.main.jobs.accuracy_analysis import *
from wb.main.jobs.create_int8_calibration_bundle.create_int8_calibration_bundle_job import \
    CreateInt8CalibrationBundleJob
from wb.main.jobs.create_int8_calibration_bundle.create_int8_calibration_scripts_job import \
    CreateInt8CalibrationScriptsJob
from wb.main.jobs.create_profiling_bundle.create_profiling_bundle_job import CreateProfilingBundleJob
from wb.main.jobs.create_profiling_bundle.create_profiling_scripts_job import CreateProfilingScriptsJob
from wb.main.jobs.create_setup_bundle.create_setup_bundle_job import CreateSetupBundleJob
from wb.main.jobs.datasets.convert_dataset_job import ConvertDatasetJob
from wb.main.jobs.datasets.dataset_augmentation_job import DatasetAugmentationJob
from wb.main.jobs.datasets.extract_dataset_job import ExtractDatasetJob, ExtractTextDatasetJob
from wb.main.jobs.datasets.recognize_dataset_job import RecognizeDatasetJob
from wb.main.jobs.datasets.validate_dataset_job import ValidateDatasetJob
from wb.main.jobs.datasets.wait_dataset_upload_job import WaitDatasetUploadJob
from wb.main.jobs.dev_cloud.accuracy.handle_accuracy_sockets_job import HandleDevCloudAccuracySocketsJob
from wb.main.jobs.dev_cloud.accuracy.handle_annotate_dataset_sockets_job import HandleDevCloudAnnotateDatasetSocketsJob
from wb.main.jobs.dev_cloud.accuracy.handle_per_tensor_distance_calculation_sockets_job import \
    HandleDevCloudPerTensorDistanceCalculationSocketsJob
from wb.main.jobs.dev_cloud.accuracy.parse_accuracy_result_job import ParseDevCloudAccuracyResultJob
from wb.main.jobs.dev_cloud.accuracy.parse_annotate_dataset_result_job import ParseDevCloudAnnotateDatasetResultJob
from wb.main.jobs.dev_cloud.accuracy.parse_per_tensor_distance_calculation_result_job import \
    ParseDevCloudPerTensorResultJob
from wb.main.jobs.dev_cloud.int8_calibration.handle_calibration_sockets_job import \
    HandleDevCloudInt8CalibrationSocketsJob
from wb.main.jobs.dev_cloud.int8_calibration.parse_int8_calibration_result_job import \
    ParseDevCloudInt8CalibrationResultJob
from wb.main.jobs.dev_cloud.profiling.handle_profiling_sockets_job import HandleDevCloudProfilingSocketsJob
from wb.main.jobs.dev_cloud.profiling.parse_profiling_result_job import ParseDevCloudProfilingResultJob
from wb.main.jobs.dev_cloud.trigger_dev_cloud_job import TriggerDevCloudJob
from wb.main.jobs.download_log.download_log_job import DownloadLogJob
from wb.main.jobs.download_model.download_model_job import DownloadModelJob
from wb.main.jobs.export_inference_report.export_inference_report_job import InferenceReportExportJob
from wb.main.jobs.export_project.export_project_job import ExportProjectJob
from wb.main.jobs.export_project_report.export_project_report_job import ProjectReportExportJob
from wb.main.jobs.get_devices.get_devices_job import GetDevicesJob
from wb.main.jobs.get_system_resources.get_system_resources_job import GetSystemResourcesJob
from wb.main.jobs.inference_test_image.inference_test_image_job import InferenceTestImageJob
from wb.main.jobs.int8_calibration.local_int8_calibration_job import LocalInt8CalibrationJob
from wb.main.jobs.int8_calibration.remote_int8_calibration_job import RemoteInt8CalibrationJob
from wb.main.jobs.models.analyze_model_input_shape_job import AnalyzeModelInputShapeJob
from wb.main.jobs.models.analyze_model_job import ModelAnalyzerJob
from wb.main.jobs.models.applay_layout_job import ApplyModelLayoutJob
from wb.main.jobs.models.reshape_model.reshape_model_job import ReshapeModelJobModel
from wb.main.jobs.models.reshape_model.create_reshape_model_scripts_job import \
    CreateReshapeModelScriptsJob
from wb.main.jobs.models.convert_keras_job import ConvertKerasJob
from wb.main.jobs.models.model_optimizer_job import ModelOptimizerJob
from wb.main.jobs.models.import_huggingface_model_job import ImportHuggingfaceModelJob
from wb.main.jobs.models.model_optimizer_scan_job import ModelOptimizerScanJob
from wb.main.jobs.models.wait_model_upload_job import WaitModelUploadJob
from wb.main.jobs.omz_models.omz_model_convert_job import OMZModelConvertJob
from wb.main.jobs.omz_models.omz_model_download_job import OMZModelDownloadJob
from wb.main.jobs.omz_models.omz_model_move_job import OMZModelMoveJob
from wb.main.jobs.profiling.local_profiling_job import LocalProfilingJob
from wb.main.jobs.profiling.profiling_job import ProfilingJob
from wb.main.jobs.profiling.remote_profiling_job import RemoteProfilingJob
from wb.main.jobs.setup_environment_job.setup_environment_job import SetupEnvironmentJob
from wb.main.jobs.setup_target.setup_target_job import SetupTargetJob
from wb.main.jobs.tokenizer import *
from wb.main.jobs.upload_artifact_to_target.upload_artifact_to_target_job import UploadArtifactToTargetJob
