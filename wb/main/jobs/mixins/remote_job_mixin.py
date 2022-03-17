"""
 OpenVINO DL Workbench
 Class-Mixin with common functions for remote jobs

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
import os
from contextlib import closing
from typing import Tuple

from config.constants import PYTHON_VIRTUAL_ENVIRONMENT_DIR, JOB_SCRIPT_NAME, JOBS_SCRIPTS_FOLDER_NAME
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.sh_tools.parser import ShParser
from wb.main.console_tool_wrapper.sh_tools.tools import RMTool, KillTool
from wb.main.console_tool_wrapper.workbench_job_tool import WorkbenchJobTool
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.tools_runner.runner_creator import create_runner


class RemoteJobMixin:

    def clean_remote_paths(self: IJob) -> Tuple[int, str]:
        job_bundle_path = self.job_bundle_path
        tool = RMTool(job_bundle_path)
        parser = ShParser(self.job_state_subject)
        with closing(get_db_session_for_celery()) as session:
            job_model = self.get_job_model(session)
            target = job_model.project.target
            runner = create_runner(target_id=target.id,
                                   tool=tool, parser=parser, session=session,
                                   working_directory=target.bundle_path)

        return runner.run_console_tool(self)

    def terminate_remote_process(self: IJob) -> Tuple[int, str]:
        openvino_bundle_path = self.openvino_bundle_path()
        job_script_path = os.path.join(self.job_bundle_path, JOBS_SCRIPTS_FOLDER_NAME, JOB_SCRIPT_NAME)
        venv_path = os.path.join(openvino_bundle_path, PYTHON_VIRTUAL_ENVIRONMENT_DIR)

        running_tool = WorkbenchJobTool(job_script_path=job_script_path,
                                        job_bundle_path=openvino_bundle_path, venv_path=venv_path)
        kill_tool = KillTool(running_tool)
        parser = ShParser(self.job_state_subject)
        with closing(get_db_session_for_celery()) as session:
            job_model = self.get_job_model(session)
            target = job_model.project.target
            runner = create_runner(target.id, kill_tool, parser, session)
        return runner.run_console_tool(self)

    @property
    def job_bundle_path(self: IJob) -> str:
        with closing(get_db_session_for_celery()) as session:
            job_model = self.get_job_model(session)
            target = job_model.project.target
            openvino_bundle_path = target.bundle_path
        return os.path.join(openvino_bundle_path, str(job_model.pipeline_id))
