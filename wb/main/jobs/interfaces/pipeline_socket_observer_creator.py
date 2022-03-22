"""
 OpenVINO DL Workbench
 Pipeline socket observer creator

 Copyright (c) 2020 Intel Corporation

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
from wb.main.enumerates import PipelineTypeEnum, SocketEventsEnum, SocketNamespacesEnum
from wb.main.jobs.accuracy_analysis.accuracy.accuracy_job_state import AccuracyPipelineSocketObserver
from wb.main.jobs.inference_test_image.inference_test_image_job_state import InferenceTestImageSocketObserver
from wb.main.jobs.interfaces.job_observers import (ConfigureTargetPipelineSocketObserver,
                                                   CreateDatasetPipelineSocketObserver,
                                                   CreateModelPipelineSocketObserver,
                                                   DeploymentManagerPipelineSocketObserver,
                                                   DownloadLogPipelineSocketObserver,
                                                   DownloadModelPipelineSocketObserver,
                                                   DownloadOMZModelPipelineSocketObserver,
                                                   ExportInferenceReportPipelineSocketObserver,
                                                   ExportProjectPipelineSocketObserver,
                                                   Int8CalibrationPipelineSocketObserver,
                                                   JobExecutionDetailsSocketObserver, PipelineSocketObserver,
                                                   ProfilingPipelineSocketObserver, ProjectReportPipelineSocketObserver,
                                                   ConfigureModelPipelineSocketObserver,
                                                   UploadTokenizerPipelineSocketObserver)
from wb.main.pipeline_creators.accuracy_analysis.per_tensor_report_pipeline_socket_observer import \
    PerTensorReportPipelineSocketObserver


class PipelineSocketObserverCreator:
    _pipeline_type_to_namespace_map = {
        PipelineTypeEnum.configure_model:
            (SocketEventsEnum.configure_model, SocketNamespacesEnum.configure_model),
        PipelineTypeEnum.deployment_manager:
            (SocketEventsEnum.deployment, SocketNamespacesEnum.deployment),
        PipelineTypeEnum.setup:
            (SocketEventsEnum.setup_target, SocketNamespacesEnum.remote_target),
        PipelineTypeEnum.ping:
            (SocketEventsEnum.ping_target, SocketNamespacesEnum.remote_target),
        PipelineTypeEnum.create_profiling_bundle:
            (SocketEventsEnum.create_profiling_bundle, SocketNamespacesEnum.create_profiling_bundle),
        PipelineTypeEnum.remote_profiling:
            (SocketEventsEnum.profiling, SocketNamespacesEnum.profiling),
        PipelineTypeEnum.dev_cloud_profiling:
            (SocketEventsEnum.profiling, SocketNamespacesEnum.profiling),
        PipelineTypeEnum.download_log:
            (SocketEventsEnum.download, SocketNamespacesEnum.log),
        PipelineTypeEnum.local_accuracy:
            (SocketEventsEnum.accuracy, SocketNamespacesEnum.accuracy),
        PipelineTypeEnum.remote_accuracy:
            (SocketEventsEnum.accuracy, SocketNamespacesEnum.accuracy),
        PipelineTypeEnum.dev_cloud_accuracy:
            (SocketEventsEnum.accuracy, SocketNamespacesEnum.accuracy),
        PipelineTypeEnum.local_predictions_relative_accuracy_report:
            (SocketEventsEnum.accuracy, SocketNamespacesEnum.accuracy),
        PipelineTypeEnum.remote_predictions_relative_accuracy_report:
            (SocketEventsEnum.accuracy, SocketNamespacesEnum.accuracy),
        PipelineTypeEnum.dev_cloud_predictions_relative_accuracy_report:
            (SocketEventsEnum.accuracy, SocketNamespacesEnum.accuracy),
        PipelineTypeEnum.local_per_tensor_report:
            (SocketEventsEnum.accuracy, SocketNamespacesEnum.accuracy),
        PipelineTypeEnum.remote_per_tensor_report:
            (SocketEventsEnum.accuracy, SocketNamespacesEnum.accuracy),
        PipelineTypeEnum.dev_cloud_per_tensor_report:
            (SocketEventsEnum.accuracy, SocketNamespacesEnum.accuracy),
        PipelineTypeEnum.download_model:
            (SocketEventsEnum.download, SocketNamespacesEnum.download),
        PipelineTypeEnum.local_int8_calibration:
            (SocketEventsEnum.int8, SocketNamespacesEnum.optimization),
        PipelineTypeEnum.remote_int8_calibration:
            (SocketEventsEnum.int8, SocketNamespacesEnum.optimization),
        PipelineTypeEnum.dev_cloud_int8_calibration:
            (SocketEventsEnum.int8, SocketNamespacesEnum.optimization),
        PipelineTypeEnum.inference_test_image:
            (SocketEventsEnum.inference_test_image, SocketNamespacesEnum.inference),
        PipelineTypeEnum.export_project_report:
            (SocketEventsEnum.download, SocketNamespacesEnum.export_project_report),
        PipelineTypeEnum.export_inference_report:
            (SocketEventsEnum.download, SocketNamespacesEnum.export_inference_report),
        PipelineTypeEnum.upload_dataset:
            (SocketEventsEnum.dataset, SocketNamespacesEnum.upload),
        PipelineTypeEnum.upload_model:
            (SocketEventsEnum.model, SocketNamespacesEnum.upload),
        PipelineTypeEnum.upload_tokenizer:
            (SocketEventsEnum.tokenizer, SocketNamespacesEnum.upload),
        PipelineTypeEnum.download_omz_model:
            (SocketEventsEnum.model, SocketNamespacesEnum.upload),
        PipelineTypeEnum.export_project:
            (SocketEventsEnum.download, SocketNamespacesEnum.export_project),
        PipelineTypeEnum.local_profiling:
            (SocketEventsEnum.profiling, SocketNamespacesEnum.profiling),
    }

    _default_observer = JobExecutionDetailsSocketObserver

    _pipeline_observers = {
        PipelineTypeEnum.local_accuracy: AccuracyPipelineSocketObserver,
        PipelineTypeEnum.remote_accuracy: AccuracyPipelineSocketObserver,
        PipelineTypeEnum.dev_cloud_accuracy: AccuracyPipelineSocketObserver,
        PipelineTypeEnum.local_predictions_relative_accuracy_report: AccuracyPipelineSocketObserver,
        PipelineTypeEnum.remote_predictions_relative_accuracy_report: AccuracyPipelineSocketObserver,
        PipelineTypeEnum.dev_cloud_predictions_relative_accuracy_report: AccuracyPipelineSocketObserver,
        PipelineTypeEnum.local_per_tensor_report: PerTensorReportPipelineSocketObserver,
        PipelineTypeEnum.remote_per_tensor_report: PerTensorReportPipelineSocketObserver,
        PipelineTypeEnum.dev_cloud_per_tensor_report: PerTensorReportPipelineSocketObserver,
        PipelineTypeEnum.deployment_manager: DeploymentManagerPipelineSocketObserver,
        PipelineTypeEnum.dev_cloud_int8_calibration: Int8CalibrationPipelineSocketObserver,
        PipelineTypeEnum.dev_cloud_profiling: ProfilingPipelineSocketObserver,
        PipelineTypeEnum.download_log: DownloadLogPipelineSocketObserver,
        PipelineTypeEnum.download_model: DownloadModelPipelineSocketObserver,
        PipelineTypeEnum.export_inference_report: ExportInferenceReportPipelineSocketObserver,
        PipelineTypeEnum.export_project: ExportProjectPipelineSocketObserver,
        PipelineTypeEnum.export_project_report: ProjectReportPipelineSocketObserver,
        PipelineTypeEnum.inference_test_image: InferenceTestImageSocketObserver,
        PipelineTypeEnum.local_int8_calibration: Int8CalibrationPipelineSocketObserver,
        PipelineTypeEnum.local_profiling: ProfilingPipelineSocketObserver,
        PipelineTypeEnum.ping: ConfigureTargetPipelineSocketObserver,
        PipelineTypeEnum.remote_int8_calibration: Int8CalibrationPipelineSocketObserver,
        PipelineTypeEnum.remote_profiling: ProfilingPipelineSocketObserver,
        PipelineTypeEnum.setup: ConfigureTargetPipelineSocketObserver,
        PipelineTypeEnum.upload_dataset: CreateDatasetPipelineSocketObserver,
        PipelineTypeEnum.upload_tokenizer: UploadTokenizerPipelineSocketObserver,
        PipelineTypeEnum.upload_model: CreateModelPipelineSocketObserver,
        PipelineTypeEnum.download_omz_model: DownloadOMZModelPipelineSocketObserver,
        PipelineTypeEnum.configure_model: ConfigureModelPipelineSocketObserver,
    }

    @classmethod
    def create(cls, current_job_id: int, pipeline_type: PipelineTypeEnum) -> PipelineSocketObserver:
        event, namespace = cls._pipeline_type_to_namespace_map[pipeline_type]
        observer = cls._pipeline_observers.get(pipeline_type, cls._default_observer)
        return observer(current_job_id=current_job_id, namespace=namespace.value, event=event.value)
