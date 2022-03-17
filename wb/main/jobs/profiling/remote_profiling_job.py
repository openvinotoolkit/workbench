"""
 OpenVINO DL Workbench
 Class for remote profiling job

 Copyright (c) 2020 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
                                job_bundle_path=self.job_bundle_path, venv_path=venv_path)
