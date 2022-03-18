"""
 OpenVINO DL Workbench
 Class for creation of per tensor bundle job

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
from contextlib import closing
from pathlib import Path

from sqlalchemy.orm import Session

from config.constants import (ARTIFACTS_PATH, ACCURACY_CONFIGURATION_FILE_NAME,
                              JOB_SCRIPT_NAME, JOBS_SCRIPTS_FOLDER_NAME, ACCURACY_ARTIFACTS_FOLDER,
                              DATASET_ANNOTATION_ARTIFACTS_FOLDER, DATASET_ANNOTATION_ACCURACY_CONFIGURATION_FILE_NAME)
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.utils.database_functions import set_status_in_db
from wb.main.models import (CreateAccuracyBundleJobModel, DownloadableArtifactsModel, PerTensorReportJobsModel, CreatePerTensorBundleJobModel)
from wb.main.models.accuracy_analysis.annotate_dataset_job_model import AnnotateDatasetJobData, AnnotateDatasetJobModel
from wb.main.models.accuracy_analysis.create_annotate_dataset_bundle_job_model import \
    CreateAnnotateDatasetBundleJobModel
from wb.main.utils.bundle_creator.job_bundle_creator import JobBundleCreator, AccuracyComponentsParams, \
    PerTensorDistanceComponentsParams, AnnotateDatasetComponentsParams


class CreateAnnotateDatasetBundleJob(IJob):
    _job_model_class = CreateAnnotateDatasetBundleJobModel
    job_type = JobTypesEnum.create_annotate_dataset_bundle_type

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running,
                                             log='Creating annotate dataset distance bundle.',
                                             progress=0)

        with closing(get_db_session_for_celery()) as session:
            session: Session
            job_model = self.get_job_model(session)
            annotate_dataset_job_model: AnnotateDatasetJobModel = (
                session.query(AnnotateDatasetJobModel).filter_by(pipeline_id=job_model.pipeline_id).first()
            )
            project = job_model.project
            model_path = project.topology.original_model.path
            dataset_path = annotate_dataset_job_model.project.dataset.dataset_data_dir
            bundle_id = job_model.bundle_id
            annotate_dataset_artifacts_path = Path(DATASET_ANNOTATION_ARTIFACTS_FOLDER) / str(job_model.pipeline_id)

        configuration_path = annotate_dataset_artifacts_path / JOBS_SCRIPTS_FOLDER_NAME / DATASET_ANNOTATION_ACCURACY_CONFIGURATION_FILE_NAME
        job_script_path = annotate_dataset_artifacts_path / JOBS_SCRIPTS_FOLDER_NAME / JOB_SCRIPT_NAME
        destination_bundle_path = Path(ARTIFACTS_PATH) / str(bundle_id)
        job_bundle_creator = JobBundleCreator(
            log_callback=lambda message, progress: self._job_state_subject.update_state(
                log=message, progress=progress)
        )

        job_bundle_creator.create(
            components=AnnotateDatasetComponentsParams(model_path=model_path,
                                                       dataset_path=dataset_path,
                                                       job_run_script=job_script_path,
                                                       config_file=configuration_path),
            destination_bundle=str(destination_bundle_path)
        )

        self.on_success()

    def on_success(self):
        with closing(get_db_session_for_celery()) as session:
            job: CreateAccuracyBundleJobModel = self.get_job_model(session)
            # TODO: [61937] Move to separate DBObserver
            bundle: DownloadableArtifactsModel = job.bundle
            bundle_path = DownloadableArtifactsModel.get_archive_path(bundle.id)
            bundle.update(bundle_path)
            bundle.write_record(session)
            set_status_in_db(DownloadableArtifactsModel, bundle.id, StatusEnum.ready, session, force=True)
        self._job_state_subject.update_state(status=StatusEnum.ready,
                                             log='Per Tensor Distance bundle creation successfully finished.')
        self._job_state_subject.detach_all_observers()
