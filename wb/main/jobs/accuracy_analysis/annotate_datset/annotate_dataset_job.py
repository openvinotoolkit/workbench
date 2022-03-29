"""
 OpenVINO DL Workbench
 Class for annotate dataset job

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

from sqlalchemy.orm import Session

from config.constants import (JOBS_SCRIPTS_FOLDER_NAME, JOB_SCRIPT_NAME, DATASET_ANNOTATION_ARTIFACTS_FOLDER,
                              JOB_ARTIFACTS_FOLDER_NAME)
from wb.error.job_error import AccuracyError
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.dataset_annotator_tools import DatasetAnnotatorParser
from wb.main.console_tool_wrapper.workbench_job_tool import WorkbenchJobTool
from wb.main.enumerates import StatusEnum
from wb.main.jobs.accuracy_analysis.annotate_datset.annotate_dataset_db_observer import AnnotateDatasetDBObserver
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.tools_runner.runner_creator import create_runner
from wb.main.models import AnnotateDatasetJobModel


class AnnotateDatasetJob(IJob):
    _job_model_class = AnnotateDatasetJobModel

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._attach_default_db_and_socket_observers()
        database_observer = AnnotateDatasetDBObserver(self.job_id)
        self.job_state_subject.attach(database_observer)
        with closing(get_db_session_for_celery()) as session:
            self._set_paths(session=session)

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, progress=0)

        with closing(get_db_session_for_celery()) as session:
            annotate_dataset_job_model: AnnotateDatasetJobModel = self.get_job_model(session)

            tool = WorkbenchJobTool(job_script_path=self._job_script_path,
                                    openvino_package_root_path=self._openvino_path,
                                    job_bundle_path=self.job_bundle_path,
                                    venv_path=self._venv_path)

            parser = DatasetAnnotatorParser(job_state_subject=self._job_state_subject)
            runner = create_runner(
                target_id=annotate_dataset_job_model.project.target_id,
                tool=tool, parser=parser, session=session,
                working_directory=self._openvino_path
            )

        return_code, message = runner.run_console_tool(self)

        if return_code:
            raise AccuracyError(message, self._job_id)

        self.collect_artifacts()

        self.on_success()

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

    @staticmethod
    def get_job_results_path(job: AnnotateDatasetJobModel) -> Path:
        return AnnotateDatasetJob.get_dataset_annotation_path(job) / JOB_ARTIFACTS_FOLDER_NAME

    @staticmethod
    def get_dataset_annotation_path(job: AnnotateDatasetJobModel) -> Path:
        pipeline_id: int = job.pipeline_id
        return Path(DATASET_ANNOTATION_ARTIFACTS_FOLDER) / str(pipeline_id)

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready)
        self._job_state_subject.detach_all_observers()
