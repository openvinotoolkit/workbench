"""
 OpenVINO DL Workbench
 Class describing reshape model job

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

from config.constants import (RESHAPE_MODEL_ARTIFACTS_PATH, JOBS_SCRIPTS_FOLDER_NAME, JOB_SCRIPT_NAME,
                              OPENVINO_ROOT_PATH)
from wb.error.job_error import ReshapeModelError
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.reshape import ReshapeToolParser, ReshapeErrorMessageProcessor
from wb.main.console_tool_wrapper.workbench_job_tool import WorkbenchJobTool
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.models.reshape_model.reshape_model_database_observer import ReshapeModelDBObserver
from wb.main.jobs.tools_runner.local_runner import LocalRunner
from wb.main.models import ReshapeModelJobModel


class ReshapeModelJob(IJob):
    _job_model_class = ReshapeModelJobModel
    job_type = JobTypesEnum.reshape_model

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self.openvino_bundle_path = OPENVINO_ROOT_PATH
        database_observer = ReshapeModelDBObserver(job_id=self._job_id)
        self._job_state_subject.attach(database_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, progress=0)
        with closing(get_db_session_for_celery()) as session:
            job_model: ReshapeModelJobModel = self.get_job_model(session)
            pipeline_id: int = job_model.pipeline_id
            job_bundle_path = RESHAPE_MODEL_ARTIFACTS_PATH / str(pipeline_id) / JOBS_SCRIPTS_FOLDER_NAME
            job_script_path = job_bundle_path / JOB_SCRIPT_NAME

            shape_configuration = job_model.shape_model_configuration.shape_configuration
            last_apply_model_layout_job = sorted(job_model.model.apply_model_layout_jobs,
                                                 key=lambda job: job.job_id, reverse=True)[0]
            layout_configuration = last_apply_model_layout_job.layout
            domain = job_model.model.domain

            tool = WorkbenchJobTool(job_script_path=job_script_path,
                                    openvino_package_root_path=self.openvino_bundle_path,
                                    job_bundle_path=job_bundle_path)

            parser = ReshapeToolParser(self._job_state_subject)

            working_directory = self.openvino_bundle_path
            runner = LocalRunner(tool, parser, working_directory)


        return_code, output = runner.run_console_tool(self, measure_performance=True)
        if return_code:
            error_processor = ReshapeErrorMessageProcessor(shape_configuration, layout_configuration, domain)
            error_message = error_processor.recognize_error(output)
            raise ReshapeModelError(error_message, self._job_id)

        self.on_success()

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready)
        self._job_state_subject.detach_all_observers()
