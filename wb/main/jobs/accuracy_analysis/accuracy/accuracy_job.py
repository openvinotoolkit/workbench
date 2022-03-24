"""
 OpenVINO DL Workbench
 Class for accuracy job

 Copyright (c) 2018 Intel Corporation

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
import os.path
import shutil
from contextlib import closing
from pathlib import Path
from typing import List, Optional

from sqlalchemy.orm import Session

from config.constants import (ACCURACY_ARTIFACTS_FOLDER, JOB_ARTIFACTS_FOLDER_NAME, JOBS_SCRIPTS_FOLDER_NAME,
                              JOB_SCRIPT_NAME)
from wb.error.job_error import AccuracyError
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.workbench_job_tool import WorkbenchJobTool

from wb.main.accuracy_report.accuracy_result_processor import AccuracyResultProcessor
from wb.main.console_tool_wrapper.accuracy_tools import AccuracyCheckerParser

from wb.main.enumerates import StatusEnum, AccuracyReportTypeEnum
from wb.main.jobs.accuracy_analysis.accuracy.accuracy_job_state import AccuracyJobStateSubject, AccuracyDBObserver
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.tools_runner.runner_creator import create_runner
from wb.main.models import AccuracyJobsModel, ProjectsModel, DatasetsModel
from wb.main.scripts.accuracy_tool.tool_output import AccuracyResult


# TODO Consider renaming class to CreateAccuracyReportJob
class AccuracyJob(IJob):
    _job_model_class = AccuracyJobsModel

    # Annotation
    _job_state_subject: AccuracyJobStateSubject

    job_bundle_path: str
    _openvino_path: str
    _venv_path: Optional[str]

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        with closing(get_db_session_for_celery()) as session:
            self._set_paths(session)
        self._job_state_subject = AccuracyJobStateSubject(self._job_id)
        accuracy_db_observer = AccuracyDBObserver(job_id=self._job_id)
        self._job_state_subject.attach(accuracy_db_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, progress=0)

        with closing(get_db_session_for_celery()) as session:
            accuracy_job: AccuracyJobsModel = self.get_job_model(session)
            project: ProjectsModel = accuracy_job.project
            project_id = project.id
            target_dataset: DatasetsModel = accuracy_job.target_dataset
            target_dataset_id = target_dataset.id
            accuracy_report_type = accuracy_job.accuracy_report_type
            accuracy_report_dir = self.get_job_results_path(accuracy_job)

            tool = WorkbenchJobTool(job_script_path=self._job_script_path,
                                    job_bundle_path=self.job_bundle_path,
                                    openvino_package_root_path=self._openvino_path,
                                    venv_path=self._venv_path)

            parser = AccuracyCheckerParser(job_state_subject=self._job_state_subject)
            runner = create_runner(
                target_id=accuracy_job.project.target_id, tool=tool,
                parser=parser, session=session,
                working_directory=self._openvino_path
            )

        return_code, message = runner.run_console_tool(self)

        if return_code:
            raise AccuracyError(message, self._job_id)

        self.collect_artifacts()

        self._process_accuracy_results(accuracy_report_type, project_id, accuracy_report_dir, target_dataset_id)

        self.on_success()

    def _process_accuracy_results(self, accuracy_report_type: AccuracyReportTypeEnum,
                                  project_id: int, accuracy_report_dir: Path, target_dataset_id: int):
        results: List[AccuracyResult] = self._job_state_subject.subject_state.accuracy_results

        AccuracyResultProcessor(
            report_type=accuracy_report_type,
            accuracy_report_dir=accuracy_report_dir,
            project_id=project_id,
            target_dataset_id=target_dataset_id
        ).process_results(results)

        if accuracy_report_dir.exists():
            shutil.rmtree(accuracy_report_dir)

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready)
        self._job_state_subject.detach_all_observers()

    @staticmethod
    def get_accuracy_artifacts_path(job: AccuracyJobsModel) -> Path:
        pipeline_id: int = job.pipeline_id
        return Path(ACCURACY_ARTIFACTS_FOLDER) / str(pipeline_id)

    @staticmethod
    def get_job_results_path(job: AccuracyJobsModel) -> Path:
        return AccuracyJob.get_accuracy_artifacts_path(job) / JOB_ARTIFACTS_FOLDER_NAME

    @property
    def _job_script_path(self) -> str:
        return os.path.join(self.job_bundle_path, JOBS_SCRIPTS_FOLDER_NAME, JOB_SCRIPT_NAME)

    def _set_paths(self, session: Session):
        """
        Set job paths for local and remote use-cases.
        This method mutates `job_bundle_path`, `_openvino_path` and `_venv_path` fields
        """
        raise NotImplementedError

    def collect_artifacts(self):
        raise NotImplementedError
