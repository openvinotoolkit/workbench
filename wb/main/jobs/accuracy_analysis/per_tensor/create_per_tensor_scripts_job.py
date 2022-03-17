"""
 OpenVINO DL Workbench
 Class for creating per tensor scripts job

 Copyright (c) 2021 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
