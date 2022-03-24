"""
 OpenVINO DL Workbench
 Class for local profiling job

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
from contextlib import closing

from sqlalchemy.orm import Session

from config.constants import OPENVINO_ROOT_PATH
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.workbench_job_tool import WorkbenchJobTool
from wb.main.enumerates import JobTypesEnum
from wb.main.jobs.profiling.profiling_job import ProfilingJob
from wb.main.jupyter_notebooks.update_jupyter_notebook_decorator import update_jupyter_notebook_job
from wb.main.models import ProfilingJobModel, TargetModel


@update_jupyter_notebook_job
class LocalProfilingJob(ProfilingJob):
    job_type = JobTypesEnum.profiling_type

    def __init__(self, job_id: int, **unused_args):
        super(LocalProfilingJob, self).__init__(job_id)
        with closing(get_db_session_for_celery()) as session:
            self.job_bundle_path = self.get_job_bundle_path(session)

    def get_job_bundle_path(self, session: Session) -> str:
        job: ProfilingJobModel = self.get_job_model(session)
        target: TargetModel = job.project.target
        return target.bundle_path

    def get_openvino_bundle_path(self, session: Session) -> str:
        return OPENVINO_ROOT_PATH

    def create_profiling_tool(self, job: ProfilingJobModel) -> WorkbenchJobTool:
        job_bundle_path = str(job.profiling_scripts_dir_path)
        job_script_path = str(job.profiling_job_script_path)

        return WorkbenchJobTool(job_script_path=job_script_path,
                                openvino_package_root_path=self.openvino_bundle_path,
                                job_bundle_path=job_bundle_path)
