"""
 OpenVINO DL Workbench
 Class for remote profiling job

 Copyright (c) 2020 Intel Corporation

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

from sqlalchemy.orm import Session

from config.constants import PYTHON_VIRTUAL_ENVIRONMENT_DIR, JOB_SCRIPT_NAME, JOBS_SCRIPTS_FOLDER_NAME
from wb.error.job_error import ProfilingError
from wb.main.console_tool_wrapper.workbench_job_tool import WorkbenchJobTool
from wb.main.enumerates import JobTypesEnum
from wb.main.jobs.profiling.profiling_job import ProfilingJob
from wb.main.jobs.mixins.remote_job_mixin import RemoteJobMixin
from wb.main.models import ProfilingJobModel, TargetModel


class RemoteProfilingJob(ProfilingJob, RemoteJobMixin):
    job_type = JobTypesEnum.remote_profiling_type

    def _clean_paths(self):
        execution_code, output = self.clean_remote_paths()
        if execution_code:
            message = f'Cannot remove folder {self.job_bundle_path}: {output}'
            raise ProfilingError(message, self._job_id)

    def terminate(self):
        super().terminate()
        return_code, output = self.terminate_remote_process()
        if return_code:
            raise ProfilingError(output, self._job_id)
        self._clean_paths()

    def get_openvino_bundle_path(self, session: Session) -> str:
        job: ProfilingJobModel = self.get_job_model(session)
        target: TargetModel = job.project.target
        return target.bundle_path

    def create_profiling_tool(self, job: ProfilingJobModel) -> WorkbenchJobTool:
        job_script_path = os.path.join(self.job_bundle_path, JOBS_SCRIPTS_FOLDER_NAME, JOB_SCRIPT_NAME)
        venv_path = os.path.join(self.openvino_bundle_path, PYTHON_VIRTUAL_ENVIRONMENT_DIR)
        return WorkbenchJobTool(job_script_path=job_script_path,
                                openvino_package_root_path=self.openvino_bundle_path,
                                job_bundle_path=self.job_bundle_path, venv_path=venv_path)
