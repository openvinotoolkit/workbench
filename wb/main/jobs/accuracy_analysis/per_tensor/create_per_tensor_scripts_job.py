"""
 OpenVINO DL Workbench
 Class for creating per tensor scripts job

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

from config.constants import (ACCURACY_ARTIFACTS_FOLDER, JOBS_SCRIPTS_FOLDER_NAME, JOB_SCRIPT_NAME)
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.models import (PerTensorReportJobsModel, CreatePerTensorScriptsJobModel)
from wb.main.scripts.job_scripts_generators.tensor_distance_job_script_generator import \
    get_tensor_distance_job_script_generator
from wb.main.utils.utils import create_empty_dir


class CreatePerTensorScriptsJob(IJob):
    job_type = JobTypesEnum.create_per_tensor_scripts_type
    _job_model_class = CreatePerTensorScriptsJobModel

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, progress=0)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job_model: CreatePerTensorScriptsJobModel = self.get_job_model(session)
            accuracy_artifacts_path = Path(ACCURACY_ARTIFACTS_FOLDER) / str(job_model.pipeline_id)
            scripts_path = accuracy_artifacts_path / JOBS_SCRIPTS_FOLDER_NAME
            job_script_file_path = scripts_path / JOB_SCRIPT_NAME
            create_empty_dir(scripts_path)
            pipeline_id = job_model.pipeline_id
            per_tensor_report_job_model: PerTensorReportJobsModel = (
                session.query(PerTensorReportJobsModel).filter_by(pipeline_id=pipeline_id).first()
            )
            job_script_generator = get_tensor_distance_job_script_generator(per_tensor_report_job_model)

        job_script_generator.create(job_script_file_path)

        self.on_success()

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready, progress=100)
        self._job_state_subject.detach_all_observers()
