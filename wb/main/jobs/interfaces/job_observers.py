"""
 OpenVINO DL Workbench
 Classes implementing Observer pattern for Jobs

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
import json
import os
from abc import abstractmethod
from contextlib import closing
from pathlib import Path
from typing import List, Union, Type, Callable, Optional

from sqlalchemy.orm import Session
from werkzeug.utils import secure_filename

from wb.extensions_factories.database import get_db_session_for_celery
from wb.extensions_factories.socket_io import get_socket_io
from wb.main.enumerates import StatusEnum
from wb.main.forms.model_optimizer import MOForm
from wb.main.jobs.datasets.dataset_augmentation_job_state import DatasetAugmentationJobState
from wb.main.jobs.datasets.extract_dataset_job_state import ExtractDatasetJobState
from wb.main.jobs.interfaces.job_state import JobState
from wb.main.jobs.models.convert_keras_job_state import ConvertKerasJobState
from wb.main.jobs.models.model_optimizer_job_state import ModelOptimizerJobState
from wb.main.jobs.models.model_optimizer_scan_job_state import ModelOptimizerScanJobState
from wb.main.jobs.profiling.profiling_job_state import ProfilingJobState
from wb.main.models import (ConvertDatasetJobsModel, ProfilingJobModel, DatasetsModel,
                            DownloadLogJobModel, ExtractDatasetJobsModel, InferenceReportExportJobModel,
                            Int8CalibrationJobModel, JobExecutionDetailsModel, JobsModel, ModelDownloadConfigsModel,
                            ParseDevCloudResultJobModel, PipelineModel, ProjectReportExportJobModel,
                            RecognizeDatasetJobsModel, ExportProjectJobModel, SingleInferenceInfoModel, TargetModel,
                            ValidateDatasetJobsModel, WaitDatasetUploadJobsModel,
                            TopologyAnalysisJobsModel, TopologiesModel, ModelOptimizerScanJobModel,
                            ModelOptimizerJobModel, OMZModelDownloadJobModel, OMZModelMoveJobModel,
                            ConvertKerasJobModel, DatasetAugmentationJobModel,
                            ParseDevCloudDatasetAnnotationResultJobModel, ImportHuggingfaceJobModel, FilesModel,
                            FileMetaData)
from wb.main.models.wait_model_upload_job_model import WaitModelUploadJobModel
from wb.main.utils.observer_pattern import Observer
from wb.main.utils.utils import get_size_of_files


def check_existing_job_model_decorator(func: Callable[['Observer', JobState], None]):
    def check_existing_job_model(job_state_observer: 'Observer', subject_state: JobState):
        with closing(get_db_session_for_celery()) as session:
            model = job_state_observer.get_job_model(session)
            if not model:
                return
            func(job_state_observer, subject_state)

    return check_existing_job_model


# Job Observers Classes
class JobStateDBObserver(Observer):
    _mapper_class = JobExecutionDetailsModel

    def __init__(self, job_id: int):
        self._job_id = job_id

    def get_job_model(self, session: Session) -> JobExecutionDetailsModel:
        return session.query(self._mapper_class).get(self._job_id)

    @check_existing_job_model_decorator
    def update(self, subject_state: JobState):
        with closing(get_db_session_for_celery()) as session:
            self._update_job_model(subject_state, session)
            self._update_job_execution_details_model(subject_state, session)

    @staticmethod
    def _update_common_job_fields(job_or_execution_details: Union[JobsModel, JobExecutionDetailsModel],
                                  subject_state: JobState):
        job_or_execution_details.progress = subject_state.progress or job_or_execution_details.progress
        job_or_execution_details.status = subject_state.status or job_or_execution_details.status
        job_or_execution_details.error_message = subject_state.error_message or job_or_execution_details.error_message

    def _update_job_model(self, subject_state: JobState, session: Session):
        job_model: JobsModel = session.query(JobsModel).get(self._job_id)
        self._update_common_job_fields(job_model, subject_state)
        job_model.write_record(session)

    def _update_job_execution_details_model(self, subject_state: JobState, session: Session):
        job_details: JobExecutionDetailsModel = session.query(JobExecutionDetailsModel).get(self._job_id)
        self._update_common_job_fields(job_details, subject_state)
        if subject_state.log:
            job_details.add_log(subject_state.log)
        job_details.warning_message = subject_state.warning_message
        job_details.write_record(session)


class PipelineSocketObserver(Observer):

    def __init__(self, current_job_id: int, namespace: str, event: str):
        self._current_job_id = current_job_id
        self._event = event
        self._namespace = namespace
        self._socket_io = get_socket_io()

    def get_job_model(self, session: Session) -> JobsModel:
        return session.query(JobsModel).get(self._current_job_id)

    @check_existing_job_model_decorator
    def update(self, unused_subject_value: JobState):
        socket_payload = self._get_socket_payload()
        self._socket_io.emit(self._event, socket_payload, namespace=self._namespace)
        self._socket_io.sleep(0)

    @abstractmethod
    def _get_socket_payload(self) -> dict:
        raise NotImplementedError('Implement method for getting socket payload in concrete Socket Observer')


class JobExecutionDetailsSocketObserver(PipelineSocketObserver):
    def _get_socket_payload(self) -> dict or List:
        session = get_db_session_for_celery()
        with closing(session):
            job_details_model = session.query(JobExecutionDetailsModel).get(self._current_job_id)
            return job_details_model.json()


class ConfigureTargetPipelineSocketObserver(PipelineSocketObserver):

    def _get_socket_payload(self) -> List:
        session = get_db_session_for_celery()
        with closing(session):
            job_model: JobsModel = session.query(JobsModel).get(self._current_job_id)
            target: TargetModel = job_model.pipeline.target
            return [pipeline.json() for pipeline in target.latest_pipelines]


class DeploymentManagerPipelineSocketObserver(PipelineSocketObserver):

    def _get_socket_payload(self) -> dict:
        session = get_db_session_for_celery()
        with closing(session):
            session: Session
            job_model: JobsModel = session.query(JobsModel).get(self._current_job_id)
            pipeline: PipelineModel = job_model.pipeline
            return pipeline.json()


class ProfilingDBObserver(JobStateDBObserver):
    _mapper_class = ProfilingJobModel

    @check_existing_job_model_decorator
    def update(self, subject_state: ProfilingJobState):
        session = get_db_session_for_celery()

        with closing(session):
            for single_inference_info in subject_state.benchmark_runs_info:
                if single_inference_info.is_auto_benchmark:
                    single_inference_job: SingleInferenceInfoModel = (
                        session.query(SingleInferenceInfoModel)
                            .filter_by(is_auto_benchmark=True, profiling_job_id=self._job_id)
                            .first()
                    )
                else:
                    batch = single_inference_info.batch
                    num_streams = single_inference_info.num_stream
                    single_inference_job: SingleInferenceInfoModel = (
                        session.query(SingleInferenceInfoModel)
                            .filter_by(batch=batch, nireq=num_streams, profiling_job_id=self._job_id)
                            .first()
                    )
                single_inference_job.update(single_inference_info)
                single_inference_job.write_record(session)

            profiling_job: ProfilingJobModel = self.get_job_model(session)
            profiling_job.progress = subject_state.progress or profiling_job.progress
            profiling_job.status = subject_state.status or profiling_job.status
            profiling_job.error_message = subject_state.error_message or profiling_job.error_message
            profiling_job.started_timestamp = subject_state.started_timestamp

            # Mark next single inference records as cancelled on failed or cancelled profiling job
            if subject_state.status in (StatusEnum.cancelled, StatusEnum.error):
                all_single_inference_runs: Optional[List[SingleInferenceInfoModel]] = profiling_job.profiling_results
                for single_inference in all_single_inference_runs:
                    if single_inference.status == StatusEnum.queued:
                        single_inference.status = StatusEnum.cancelled
            profiling_job.write_record(session)


class ProfilingPipelineSocketObserver(PipelineSocketObserver):

    def _get_socket_payload(self) -> dict:
        session = get_db_session_for_celery()
        with closing(session):
            job = session.query(JobsModel).get(self._current_job_id)
            return job.pipeline.json()


class DownloadModelDBObserver(JobStateDBObserver):
    _mapper_class = ModelDownloadConfigsModel

    @check_existing_job_model_decorator
    def update(self, subject_state: JobState):
        session = get_db_session_for_celery()
        with closing(session):
            download_model_job: ModelDownloadConfigsModel = self.get_job_model(session)
            download_model_job.progress = subject_state.progress or download_model_job.progress
            download_model_job.status = subject_state.status or download_model_job.status
            download_model_job.error_message = subject_state.error_message or download_model_job.error_message

            artifact = download_model_job.downloadable_artifact
            artifact.progress = subject_state.progress or artifact.progress
            artifact.status = subject_state.status or artifact.status
            artifact.error_message = subject_state.error_message or artifact.error_message
            download_model_job.write_record(session)


class ExportProjectPipelineSocketObserver(PipelineSocketObserver):

    def _get_socket_payload(self) -> dict:
        session = get_db_session_for_celery()
        with closing(session):
            download_job = session.query(ExportProjectJobModel).get(self._current_job_id)
            pipeline: PipelineModel = download_job.pipeline
            return pipeline.json()


class ExportProjectDBObserver(JobStateDBObserver):
    _mapper_class = ExportProjectJobModel

    @check_existing_job_model_decorator
    def update(self, subject_state: JobState):
        with closing(get_db_session_for_celery()) as session:
            export_project_job: ModelDownloadConfigsModel = self.get_job_model(session)
            export_project_job.progress = subject_state.progress or export_project_job.progress
            export_project_job.status = subject_state.status or export_project_job.status
            export_project_job.error_message = subject_state.error_message or export_project_job.error_message

            artifact = export_project_job.downloadable_artifact
            artifact.progress = subject_state.progress or artifact.progress
            artifact.status = subject_state.status or artifact.status
            artifact.error_message = subject_state.error_message or artifact.error_message
            export_project_job.write_record(session)


class DownloadModelPipelineSocketObserver(PipelineSocketObserver):
    def _get_socket_payload(self) -> dict:
        session = get_db_session_for_celery()
        with closing(session):
            archiving_job = session.query(ModelDownloadConfigsModel).get(self._current_job_id)
            return archiving_job.json()


class DownloadLogDBObserver(JobStateDBObserver):
    _mapper_class = DownloadLogJobModel

    @check_existing_job_model_decorator
    def update(self, subject_state: JobState):
        with closing(get_db_session_for_celery()) as session:
            download_log_job: DownloadLogJobModel = self.get_job_model(session)
            download_log_job.progress = subject_state.progress or download_log_job.progress
            download_log_job.status = subject_state.status or download_log_job.status
            download_log_job.error_message = subject_state.error_message or download_log_job.error_message

            artifact = download_log_job.downloadable_artifact
            artifact.progress = subject_state.progress or artifact.progress
            artifact.status = subject_state.status or artifact.status
            artifact.error_message = subject_state.error_message or artifact.error_message
            download_log_job.write_record(session)


class DownloadLogPipelineSocketObserver(PipelineSocketObserver):

    def _get_socket_payload(self) -> dict:
        session = get_db_session_for_celery()
        with closing(session):
            download_job = session.query(DownloadLogJobModel).get(self._current_job_id)
            return download_job.json()


class ExportProjectReportDBObserver(JobStateDBObserver):
    _mapper_class = ProjectReportExportJobModel

    @check_existing_job_model_decorator
    def update(self, subject_state: JobState):
        session = get_db_session_for_celery()
        with closing(session):
            export_report_job: ProjectReportExportJobModel = self.get_job_model(session)
            export_report_job.progress = subject_state.progress or export_report_job.progress
            export_report_job.status = subject_state.status or export_report_job.status
            export_report_job.error_message = subject_state.error_message or export_report_job.error_message

            artifact = export_report_job.downloadable_artifact
            artifact.progress = subject_state.progress or artifact.progress
            artifact.status = subject_state.status or artifact.status
            artifact.error_message = subject_state.error_message or artifact.error_message
            export_report_job.write_record(session)


class ExportInferenceReportDBObserver(JobStateDBObserver):
    _mapper_class = InferenceReportExportJobModel

    @check_existing_job_model_decorator
    def update(self, subject_state: JobState):
        session = get_db_session_for_celery()
        with closing(session):
            export_report_job: InferenceReportExportJobModel = self.get_job_model(session)
            export_report_job.progress = subject_state.progress or export_report_job.progress
            export_report_job.status = subject_state.status or export_report_job.status
            export_report_job.error_message = subject_state.error_message or export_report_job.error_message

            artifact = export_report_job.downloadable_artifact
            artifact.progress = subject_state.progress or artifact.progress
            artifact.status = subject_state.status or artifact.status
            artifact.error_message = subject_state.error_message or artifact.error_message
            export_report_job.write_record(session)


class ExportInferenceReportPipelineSocketObserver(PipelineSocketObserver):

    def _get_socket_payload(self) -> dict:
        session = get_db_session_for_celery()
        with closing(session):
            export_report_job = session.query(InferenceReportExportJobModel).get(self._current_job_id)
            return export_report_job.json()


class Int8CalibrationDBObserver(JobStateDBObserver):
    _mapper_class = Int8CalibrationJobModel

    @check_existing_job_model_decorator
    def update(self, subject_state: JobState):
        session = get_db_session_for_celery()
        with closing(session):
            int8_job_model: Int8CalibrationJobModel = self.get_job_model(session)
            int8_job_model.progress = subject_state.progress or int8_job_model.progress
            int8_job_model.status = subject_state.status or int8_job_model.status
            int8_job_model.error_message = subject_state.error_message or int8_job_model.error_message
            int8_job_model.write_record(session)


class ParseDevCloudResultDBObserver(JobStateDBObserver):
    _mapper_class = ParseDevCloudResultJobModel

    @check_existing_job_model_decorator
    def update(self, subject_state: JobState):
        session = get_db_session_for_celery()
        with closing(session):
            parse_dev_cloud_job_model: ParseDevCloudResultJobModel = self.get_job_model(session)
            parse_dev_cloud_job_model.progress = subject_state.progress or parse_dev_cloud_job_model.progress
            parse_dev_cloud_job_model.status = subject_state.status or parse_dev_cloud_job_model.status
            parse_dev_cloud_job_model.error_message = subject_state.error_message or \
                                                      parse_dev_cloud_job_model.error_message
            parse_dev_cloud_job_model.write_record(session)


class ParseDevCloudAnnotateDatasetResultDBObserver(ParseDevCloudResultDBObserver):
    _mapper_class = ParseDevCloudDatasetAnnotationResultJobModel

    @check_existing_job_model_decorator
    def update(self, subject_state: JobState):
        super().update(subject_state)
        with closing(get_db_session_for_celery()) as session:
            parse_dev_cloud_job_model: ParseDevCloudResultJobModel = self.get_job_model(session)
            dataset = parse_dev_cloud_job_model.auto_annotated_dataset
            dataset.progress = subject_state.progress or parse_dev_cloud_job_model.progress
            dataset.status = subject_state.status or parse_dev_cloud_job_model.status
            dataset.error_message = subject_state.error_message or parse_dev_cloud_job_model.error_message
            dataset.write_record(session)


class Int8CalibrationPipelineSocketObserver(PipelineSocketObserver):
    def _get_socket_payload(self) -> dict:
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job: JobsModel = session.query(JobsModel).get(self._current_job_id)
            return job.pipeline.json()


class ProjectReportPipelineSocketObserver(PipelineSocketObserver):
    def _get_socket_payload(self) -> dict:
        with closing(get_db_session_for_celery()) as session:
            session: Session
            export_report_job: ProjectReportExportJobModel = session.query(ProjectReportExportJobModel).get(
                self._current_job_id)
            return export_report_job.json()


CreateDatasetMapperClassType = Union[Type[RecognizeDatasetJobsModel], Type[ValidateDatasetJobsModel],
                                     Type[WaitDatasetUploadJobsModel], Type[ConvertDatasetJobsModel]]


class CreateDatasetDBObserver(JobStateDBObserver):
    def __init__(self, job_id: int, mapper_class: CreateDatasetMapperClassType):
        super().__init__(job_id)
        self._mapper_class = mapper_class

    @check_existing_job_model_decorator
    def update(self, subject_state: Union[JobState, DatasetAugmentationJobState]):
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job: Type[CreateDatasetMapperClassType] = self.get_job_model(session)
            job.progress = subject_state.progress or job.progress
            job.status = subject_state.status or job.status
            job.error_message = subject_state.error_message or job.error_message
            job.write_record(session)

            # Update related dataset models
            job_dataset_model: DatasetsModel = job.dataset
            dataset_models_to_update = [job_dataset_model]
            if job_dataset_model.converted_to:
                dataset_models_to_update.append(job_dataset_model.converted_to)
            if job_dataset_model.converted_from:
                dataset_models_to_update.append(job_dataset_model.converted_from)
            for dataset_model in dataset_models_to_update:
                self.update_dataset_record(subject_state, session, job.pipeline, dataset_model)

    @staticmethod
    def update_dataset_record(subject_state: Union[JobState, DatasetAugmentationJobState],
                              session: Session,
                              pipeline: PipelineModel,
                              dataset: DatasetsModel):
        dataset.progress = pipeline.pipeline_progress
        dataset.status = pipeline.pipeline_status_name
        if subject_state.status == StatusEnum.error:
            dataset.status = subject_state.status
            dataset.error_message = subject_state.error_message or dataset.error_message
        if subject_state.status == StatusEnum.cancelled:
            dataset.status = subject_state.status
        if pipeline.last_pipeline_job.status == StatusEnum.ready:
            dataset.progress = 100
            dataset.status = StatusEnum.ready
            dataset.set_checksum()
        DatasetsModel.write_record(dataset, session)


class ExtractDatasetDBObserver(CreateDatasetDBObserver):
    _mapper_class = ExtractDatasetJobsModel

    @check_existing_job_model_decorator
    def update(self, subject_state: ExtractDatasetJobState):
        super().update(subject_state)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job: ExtractDatasetJobsModel = session.query(self._mapper_class).get(self._job_id)
            datasets: List[DatasetsModel] = job.dataset.original_and_converted
            if subject_state.dataset_path:
                datasets[0].path = subject_state.dataset_path
            if subject_state.dataset_size:
                for dataset in datasets:
                    dataset.size = subject_state.dataset_size
            DatasetsModel.write_records(datasets, session)


class AugmentDatasetDBObserver(CreateDatasetDBObserver):
    _mapper_class = DatasetAugmentationJobModel

    @check_existing_job_model_decorator
    def update(self, subject_state: DatasetAugmentationJobState):
        super().update(subject_state)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job: ExtractDatasetJobsModel = session.query(self._mapper_class).get(self._job_id)
            dataset: DatasetsModel = job.dataset
            if subject_state.dataset_size:
                dataset.size = subject_state.dataset_size
            if subject_state.dataset_images:
                dataset.number_images = subject_state.dataset_images
            dataset.write_record(session)


class CreateDatasetPipelineSocketObserver(PipelineSocketObserver):
    def _get_socket_payload(self) -> dict:
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job: JobsModel = session.query(JobsModel).get(self._current_job_id)
            if job.dataset.converted_to:
                return job.dataset.converted_to.json()
            return job.dataset.json()


CreateModelMapperClassType = Union[Type[TopologyAnalysisJobsModel], Type[WaitModelUploadJobModel]]


class CreateModelDBObserver(JobStateDBObserver):
    def __init__(self, job_id: int, mapper_class: CreateModelMapperClassType):
        super().__init__(job_id)
        self._mapper_class = mapper_class

    @check_existing_job_model_decorator
    def update(self, subject_state: JobState):
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job: Type[CreateModelMapperClassType] = self.get_job_model(session)
            job.progress = subject_state.progress or job.progress
            job.status = subject_state.status or job.status
            job.error_message = subject_state.error_message or job.error_message
            job.write_record(session)

            model_creation_pipeline: PipelineModel = job.pipeline

            model: TopologiesModel = session.query(TopologiesModel).filter_by(converted_from=job.model.id).first()
            if not model:
                model: TopologiesModel = job.model
            model.progress = model_creation_pipeline.pipeline_progress
            model.status = model_creation_pipeline.pipeline_status_name
            if subject_state.status == StatusEnum.error:
                model.error_message = subject_state.error_message or model.error_message
                model.status = StatusEnum.error

            model_analyzer_job = model_creation_pipeline.get_job_by_type(
                job_type=TopologyAnalysisJobsModel.get_polymorphic_job_type()
            )
            # Model Analyzer job is supposed to be the final job of uploading model process (creating in case of INT8)
            # If model analysis succeeds, we assume that model artifact is ready
            if model_analyzer_job.status == StatusEnum.ready:
                model.progress = 100
                model.status = StatusEnum.ready
                model.size = get_size_of_files(model.path)
                model.set_checksum()
            model.write_record(session)


class ImportHuggingfaceModelDBObserver(JobStateDBObserver):
    def __init__(self, job_id: int, mapper_class: Type[ImportHuggingfaceJobModel]):
        super().__init__(job_id)
        self._mapper_class = mapper_class

    @check_existing_job_model_decorator
    def update(self, subject_state: JobState):
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job: ImportHuggingfaceJobModel = self.get_job_model(session)
            topology = job.model

            if subject_state.status == StatusEnum.error or subject_state.status == StatusEnum.cancelled:
                topology.status = subject_state.status
                topology.write_record(session)
                return

            if subject_state.status != StatusEnum.ready:
                return

            file_record = self.create_file(
                file=FileMetaData(
                    name='model.onnx',
                    size=os.path.getsize(Path(topology.path) / 'model.onnx')
                ),
                artifact_id=topology.id,
                artifact_path=topology.path,
                session=session
            )

            file_record.uploaded_blob_size = file_record.size
            file_record.progress = 100
            file_record.status = StatusEnum.ready
            file_record.write_record(session)

            topology.size = file_record.size
            topology.status = StatusEnum.ready
            topology.progress = 100
            topology.write_record(session)

    @staticmethod
    def create_file_record(file_data: FileMetaData, artifact_id: int, path: str, session: Session) -> FilesModel:
        file_record = FilesModel(file_data['name'], artifact_id, file_data['size'])
        file_record.path = path
        file_record.write_record(session)
        return file_record

    @classmethod
    def create_file(cls, file: FileMetaData, artifact_id: int, artifact_path: str, session: Session) -> FilesModel:
        file['name'] = secure_filename(file['name'])
        file_path = os.path.join(artifact_path, file['name'])
        return cls.create_file_record(file, artifact_id, file_path, session)


class ConvertKerasModelDBObserver(CreateModelDBObserver):

    @check_existing_job_model_decorator
    def update(self, subject_state: ConvertKerasJobState):
        super().update(subject_state=subject_state)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job: ConvertKerasJobModel = self.get_job_model(session)
            model: TopologiesModel = job.model
            if subject_state.model_path:
                model.path = subject_state.model_path
            model.write_record(session)


class CreateModelPipelineSocketObserver(PipelineSocketObserver):
    def _get_socket_payload(self) -> dict:
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job: JobsModel = session.query(JobsModel).get(self._current_job_id)
            model: TopologiesModel = session.query(TopologiesModel).filter_by(converted_from=job.model.id).first()
            model_creation_pipeline: PipelineModel = job.pipeline
            mo_job: ModelOptimizerJobModel = session.query(ModelOptimizerJobModel).get(self._current_job_id)
            if not model:
                model = job.model
            json_message = model.json()
            if hasattr(job, 'information') and job.information:
                params = json.loads(job.information)
                json_message['mo'] = {'analyzedParams': params}
            if mo_job:
                json_message['mo'] = {
                    'params': MOForm.to_params(json.loads(mo_job.mo_args or '{}'))
                }
                if mo_job.status == StatusEnum.error:
                    json_message['mo'].update({
                        'errorMessage': mo_job.error_message
                    })
            json_message['stages'] = [
                {'progress': pipeline_job.progress, 'name': pipeline_job.status.value, 'stage': pipeline_job.job_type,
                 'errorMessage': job.error_message}
                for pipeline_job in model_creation_pipeline.sorted_jobs]

            return json_message


class MOScanDBObserver(CreateModelDBObserver):
    _mapper_class = ModelOptimizerScanJobModel

    @check_existing_job_model_decorator
    def update(self, subject_state: ModelOptimizerScanJobState):
        super().update(subject_state)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job: ModelOptimizerScanJobModel = self.get_job_model(session)
            model: TopologiesModel = job.model
            if subject_state.scan_results:
                job.information = subject_state.scan_results
                job.status = StatusEnum.ready
                job.progress = 100
                model.set_checksum()
            job.write_record(session)
            model.write_record(session)


class ModelOptimizerDBObserver(JobStateDBObserver):
    _mapper_class = ModelOptimizerJobModel

    @check_existing_job_model_decorator
    def update(self, subject_state: ModelOptimizerJobState):
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job: ModelOptimizerJobModel = self.get_job_model(session)
            job.progress = subject_state.progress or job.progress
            job.status = subject_state.status or job.status
            job.error_message = subject_state.error_message or job.error_message
            if subject_state.detailed_error_message:
                job.detailed_error_message = subject_state.detailed_error_message
            if subject_state.mo_args:
                job.mo_args = subject_state.mo_args
            job.write_record(session)

            model_creation_pipeline: PipelineModel = job.pipeline

            original_model: TopologiesModel = job.original_topology
            resulting_model: TopologiesModel = job.model
            resulting_model.progress = model_creation_pipeline.pipeline_progress
            resulting_model.status = model_creation_pipeline.pipeline_status_name
            if subject_state.model_path:
                resulting_model.path = subject_state.model_path
            if subject_state.status == StatusEnum.error:
                resulting_model.error_message = subject_state.error_message or resulting_model.error_message
            if subject_state.status == StatusEnum.ready:
                original_model.progress = 100
                original_model.status = StatusEnum.ready
                resulting_model.size = get_size_of_files(resulting_model.path)

            resulting_model.write_record(session)


OMZModelMapperClassType = Union[Type[OMZModelDownloadJobModel], Type[OMZModelMoveJobModel]]


class OMZModelDownloadDBObserver(JobStateDBObserver):
    def __init__(self, job_id: int, mapper_class: OMZModelMapperClassType):
        super().__init__(job_id)
        self._mapper_class = mapper_class

    @check_existing_job_model_decorator
    def update(self, subject_state: JobState):
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job: JobsModel = self.get_job_model(session)
            job.progress = subject_state.progress or job.progress
            job.status = subject_state.status or job.status
            job.error_message = subject_state.error_message or job.error_message
            job.write_record(session)

            model_download_pipeline: PipelineModel = job.pipeline

            model = job.model
            model.progress = model_download_pipeline.pipeline_progress
            model.status = model_download_pipeline.pipeline_status_name
            if subject_state.status == StatusEnum.error:
                model.error_message = subject_state.error_message or model.error_message
            model.write_record(session)


class DownloadOMZModelPipelineSocketObserver(PipelineSocketObserver):
    def _get_socket_payload(self) -> dict:
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job: JobsModel = session.query(JobsModel).get(self._current_job_id)
            model: TopologiesModel = job.model
            model_creation_pipeline: PipelineModel = job.pipeline
            json_message = model.json()
            if hasattr(job, 'conversion_args') and job.conversion_args:
                if 'mo' not in json_message:
                    json_message['mo'] = {}
                json_message['mo'].update({
                    'params': {
                        'dataType': json.loads(job.conversion_args)['precision']
                    }
                })
            json_message['stages'] = [
                {'progress': pipeline_job.progress, 'name': pipeline_job.status.value, 'stage': pipeline_job.job_type}
                for pipeline_job in model_creation_pipeline.sorted_jobs]
            return json_message


class UploadTokenizerPipelineSocketObserver(PipelineSocketObserver):
    def _get_socket_payload(self) -> dict:
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job: JobsModel = session.query(JobsModel).get(self._current_job_id)
            return job.tokenizer.json()


class ConfigureModelPipelineSocketObserver(PipelineSocketObserver):
    def _get_socket_payload(self) -> dict:
        with closing(get_db_session_for_celery()) as session:
            job_model: JobsModel = self.get_job_model(session)
            return job_model.pipeline.json()
