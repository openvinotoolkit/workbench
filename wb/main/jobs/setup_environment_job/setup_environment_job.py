"""
 OpenVINO DL Workbench
 Class for creating int8 optimization scripts job

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

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.environment.manager import EnvironmentManager
from wb.main.environment.manifest import ManifestFactory
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.setup_environment_job.setup_environment_db_observer import SetupEnvironmentDBObserver
from wb.main.jobs.setup_environment_job.setup_environment_job_state import SetupEnvironmentJobStateSubject
from wb.main.models import SetupEnvironmentJobModel, TopologyAnalysisJobsModel, WBInfoModel, TopologiesModel


class SetupEnvironmentJob(IJob):
    job_type = JobTypesEnum.setup_environment_job
    _job_model_class = SetupEnvironmentJobModel

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._job_state_subject: SetupEnvironmentJobStateSubject = SetupEnvironmentJobStateSubject(self._job_id)
        db_observer = SetupEnvironmentDBObserver(job_id=self.job_id)
        self._job_state_subject.attach(db_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(progress=0, status=StatusEnum.running)
        session = get_db_session_for_celery()
        with closing(session):
            job: SetupEnvironmentJobModel = self.get_job_model(session)
            model = job.model

            if model.status in (StatusEnum.cancelled, StatusEnum.error):
                return

            manifest_path = Path(model.manifest_path)
            manifest = ManifestFactory.load_from_file(manifest_path)
            environment_manager = EnvironmentManager(manifest=manifest,
                                                     log_callback=self.job_state_subject.update_state)

            wb_info: WBInfoModel = session.query(WBInfoModel).first()

            environment = environment_manager.get_suitable_environment(session=session, is_prc=wb_info.is_prc)

            self._job_state_subject.finish_environment_setup(environment_id=environment.id)

    def on_failure(self, exception: Exception):
        super().on_failure(exception)
        self._job_state_subject.update_state(status=StatusEnum.error, error_message=str(exception))
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job = self.get_job_model(session)
            model_analyzer_job: TopologyAnalysisJobsModel = \
                session.query(TopologyAnalysisJobsModel).filter_by(pipeline_id=job.pipeline.id).first()
            model = model_analyzer_job.model
            model.status = StatusEnum.error
            model.error_message = str(exception)
            model.write_record(session)

    def set_task_id(self, task_id: str):
        super().set_task_id(task_id=task_id)
        with closing(get_db_session_for_celery()) as session:
            job: SetupEnvironmentJobModel = self.get_job_model(session)
            model: TopologiesModel = job.model
            if not model:
                return
            model.task_id = task_id
            model.write_record(session=session)
            if model.converted_from_record:
                model.converted_from_record.task_id = task_id
                model.converted_from_record.write_record(session=session)
            if model.converted_to:
                for result_model in model.converted_to:
                    result_model.task_id = task_id
                    result_model.write_record(session=session)
