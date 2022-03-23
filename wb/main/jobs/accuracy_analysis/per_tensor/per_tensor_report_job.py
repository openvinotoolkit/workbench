"""
 OpenVINO DL Workbench
 Class for per tensor report job

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
import os
from contextlib import closing
from pathlib import Path
from typing import Optional

from sqlalchemy.orm import Session

from config.constants import (ACCURACY_ARTIFACTS_FOLDER, JOB_ARTIFACTS_FOLDER_NAME, JOBS_SCRIPTS_FOLDER_NAME,
                              JOB_SCRIPT_NAME)
from wb.error.job_error import AccuracyError
from wb.extensions_factories.database import get_db_session_for_celery

from wb.main.accuracy_report.per_tensor_report_processor import PerTensorReportProcessor
from wb.main.console_tool_wrapper.per_tensor_distance_calculator import PerTensorDistanceCalculatorParser
from wb.main.console_tool_wrapper.workbench_job_tool import WorkbenchJobTool
from wb.main.enumerates import StatusEnum, JobTypesEnum
from wb.main.jobs.accuracy_analysis.per_tensor.per_tensor_analysis_job_state import PerTensorAnalysisJobStateSubject
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.tools_runner.runner_creator import create_runner
from wb.main.models import PerTensorReportJobsModel
from wb.main.shared.constants import TENSOR_DISTANCE_REPORT_FILE_NAME


class PerTensorReportJob(IJob):
    job_type = JobTypesEnum.per_tensor_report_type
    _job_model_class = PerTensorReportJobsModel
    # Annotations
    job_bundle_path: str
    _openvino_path: str
    _venv_path: Optional[str]
    _job_state_subject: PerTensorAnalysisJobStateSubject

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        with closing(get_db_session_for_celery()) as session:
            self._set_paths(session)
        self._job_state_subject = PerTensorAnalysisJobStateSubject(self._job_id)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, progress=0)

        with closing(get_db_session_for_celery()) as session:
            per_tensor_job: PerTensorReportJobsModel = self.get_job_model(session)
            tool = WorkbenchJobTool(job_script_path=self._job_script_path,
                                    job_bundle_path=self.job_bundle_path,
                                    venv_path=self._venv_path)

            parser = PerTensorDistanceCalculatorParser(job_state_subject=self._job_state_subject)
            runner = create_runner(
                target_id=per_tensor_job.project.target_id, tool=tool,
                parser=parser, session=session,
                working_directory=self._openvino_path
            )

            return_code, message = runner.run_console_tool(self)

            if return_code:
                raise AccuracyError(message, self._job_id)

            self.collect_artifacts()

            self._process_report(session)

            self.on_success()

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready)
        self._job_state_subject.detach_all_observers()

    def collect_artifacts(self):
        raise NotImplementedError

    def _set_paths(self, session):
        """
        Set job paths for local and remote use-cases.
        This method mutates `job_bundle_path`, `_openvino_path` and `_venv_path` fields
        """
        raise NotImplementedError

    @staticmethod
    def get_artifacts_path(job: PerTensorReportJobsModel) -> Path:
        pipeline_id: int = job.pipeline_id
        return Path(ACCURACY_ARTIFACTS_FOLDER) / str(pipeline_id)

    @staticmethod
    def get_job_results_path(job: PerTensorReportJobsModel) -> Path:
        return PerTensorReportJob.get_artifacts_path(job) / JOB_ARTIFACTS_FOLDER_NAME

    @property
    def _job_script_path(self) -> str:
        return os.path.join(self.job_bundle_path, JOBS_SCRIPTS_FOLDER_NAME, JOB_SCRIPT_NAME)

    def _process_report(self, session: Session):
        per_tensor_job: PerTensorReportJobsModel = self.get_job_model(session)
        job_results_path = self.get_job_results_path(per_tensor_job)
        results_file_path = job_results_path / TENSOR_DISTANCE_REPORT_FILE_NAME
        report_processor = PerTensorReportProcessor(results_file_path, per_tensor_job.project_id)
        report_processor.process_results(session)

