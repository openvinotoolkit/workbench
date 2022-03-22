"""
 OpenVINO DL Workbench
 Class for local profiling job

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
