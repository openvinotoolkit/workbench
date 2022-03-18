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
                              JOB_SCRIPT_NAME, JOBS_SCRIPTS_FOLDER_NAME, ACCURACY_ARTIFACTS_FOLDER)
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.utils.database_functions import set_status_in_db
from wb.main.models import (CreateAccuracyBundleJobModel, DownloadableArtifactsModel, PerTensorReportJobsModel, CreatePerTensorBundleJobModel)
from wb.main.utils.bundle_creator.job_bundle_creator import JobBundleCreator, AccuracyComponentsParams, \
    PerTensorDistanceComponentsParams


class CreatePerTensorBundleJob(IJob):
    _job_model_class = CreatePerTensorBundleJobModel
    job_type = JobTypesEnum.create_per_tensor_bundle_type

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, log='Creating per tensor distance bundle.',
                                             progress=0)

        with closing(get_db_session_for_celery()) as session:
            session: Session
            job_model = self.get_job_model(session)
            per_tensor_report_job_model: PerTensorReportJobsModel = (
                session.query(PerTensorReportJobsModel).filter_by(pipeline_id=job_model.pipeline_id).first()
            )
            project = job_model.project
            optimized_model_path = project.topology.path
            parent_model_path = project.topology.optimized_from_record.path
            dataset_path = per_tensor_report_job_model.project.dataset.dataset_data_dir
            bundle_id = job_model.bundle_id
            accuracy_artifacts_path = Path(ACCURACY_ARTIFACTS_FOLDER) / str(job_model.pipeline_id)

        job_script_path = accuracy_artifacts_path / JOBS_SCRIPTS_FOLDER_NAME / JOB_SCRIPT_NAME
        destination_bundle_path = Path(ARTIFACTS_PATH) / str(bundle_id)
        job_bundle_creator = JobBundleCreator(
            log_callback=lambda message, progress: self._job_state_subject.update_state(
                log=message, progress=progress)
        )

        job_bundle_creator.create(
            components=PerTensorDistanceComponentsParams(optimized_model_path=optimized_model_path,
                                                         parent_model_path=parent_model_path,
                                                         dataset_path=dataset_path,
                                                         job_run_script=job_script_path,),
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
