"""
 OpenVINO DL Workbench
 Class for creation of accuracy bundle job

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
from wb.main.models import (CreateAccuracyBundleJobModel, DownloadableArtifactsModel, AccuracyJobsModel)
from wb.main.utils.bundle_creator.job_bundle_creator import JobBundleCreator, AccuracyComponentsParams


class CreateAccuracyBundleJob(IJob):
    _job_model_class = CreateAccuracyBundleJobModel
    job_type = JobTypesEnum.create_accuracy_bundle_type

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, log='Creating accuracy bundle.', progress=0)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job_model = self.get_job_model(session)
            accuracy_job_model: AccuracyJobsModel = (
                session.query(AccuracyJobsModel).filter_by(pipeline_id=job_model.pipeline_id).first()
            )
            project = job_model.project
            model_path = project.topology.path
            dataset_path = accuracy_job_model.target_dataset.path
            bundle_id = job_model.shared_artifact.id
            accuracy_artifacts_path = Path(ACCURACY_ARTIFACTS_FOLDER) / str(job_model.pipeline_id)

        configuration_path = accuracy_artifacts_path / JOBS_SCRIPTS_FOLDER_NAME / ACCURACY_CONFIGURATION_FILE_NAME
        job_script_path = accuracy_artifacts_path / JOBS_SCRIPTS_FOLDER_NAME / JOB_SCRIPT_NAME
        destination_bundle_path = Path(ARTIFACTS_PATH) / str(bundle_id)
        job_bundle_creator = JobBundleCreator(
            log_callback=lambda message, progress: self._job_state_subject.update_state(
                log=message, progress=progress)
        )

        job_bundle_creator.create(
            components=AccuracyComponentsParams(model_path=model_path,
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
            bundle: DownloadableArtifactsModel = job.shared_artifact
            bundle_path = bundle.build_full_artifact_path()
            bundle.update(bundle_path)
            bundle.write_record(session)
            set_status_in_db(DownloadableArtifactsModel, bundle.id, StatusEnum.ready, session, force=True)
        self._job_state_subject.update_state(status=StatusEnum.ready,
                                             log='Accuracy bundle creation successfully finished.')
        self._job_state_subject.detach_all_observers()
