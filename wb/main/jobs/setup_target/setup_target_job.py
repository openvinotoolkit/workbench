"""
 OpenVINO DL Workbench
 Class for setting up of target job

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
from contextlib import closing

from sqlalchemy.orm import Session

from wb.error.job_error import SetupTargetError
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.sh_tools.parser import ShParser
from wb.main.console_tool_wrapper.sh_tools.setup_error_message_processor import SetupErrorMessageProcessor
from wb.main.console_tool_wrapper.sh_tools.tools import SetupTargetTool
from wb.main.enumerates import JobTypesEnum
from wb.main.enumerates import StatusEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.tools_runner.runner_creator import create_runner
from wb.main.models.cpu_info_model import CPUInfoModel
from wb.main.models.remote_target_model import RemoteTargetModel
from wb.main.models.setup_target_jobs_model import SetupTargetJobsModel
from wb.main.utils.cpu_info_parser import CPUInfoParser


class SetupTargetJob(IJob):
    _job_model_class = SetupTargetJobsModel
    job_type = JobTypesEnum.setup_target_type

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, log='Starting setup process.')
        with closing(get_db_session_for_celery()) as session:
            setup_target_job: SetupTargetJobsModel = self.get_job_model(session)
            setup_bundle_path = setup_target_job.setup_bundle_path
            target = setup_target_job.target
            target_id = setup_target_job.target_id
            http_proxy_url, https_proxy_url = target.get_proxy_urls()
        parser = ShParser(self._job_state_subject)
        tool = SetupTargetTool('./scripts/setup.sh', environment={
            'http_proxy': http_proxy_url,
            'https_proxy': https_proxy_url
        })
        with closing(get_db_session_for_celery()) as session:
            runner = create_runner(target_id, tool, parser, session, working_directory=setup_bundle_path)
        return_code, output = runner.run_console_tool(self)
        if return_code:
            error_type = SetupErrorMessageProcessor.recognize_error(error_message=output, stage='Setup target')
            raise SetupTargetError(error_type, self._job_id)
        warning = SetupErrorMessageProcessor.recognize_warning(output)
        if warning:
            self.set_warning(warning)
        result = SetupTargetTool.parse_tool_output(output)
        # Write target machine information
        with closing(get_db_session_for_celery()) as session:
            session: Session
            remote_target: RemoteTargetModel = session.query(RemoteTargetModel).get(target_id)
            remote_target.os = result.os
            remote_target.has_root_privileges = result.has_root_privileges
            remote_target.has_internet_connection = result.has_internet_connection
            remote_target.python_version = result.python_version
            remote_target.pip_version = result.pip_version
            if not result.home_directory:
                raise SetupTargetError('Cannot find home directory.', self._job_id)
            remote_target.home_directory = result.home_directory
            parsed_cpu_info = CPUInfoParser.parse_cpu_full_name(cpu_full_name=result.cpu_full_name)
            cpu_info = CPUInfoModel(name=result.cpu_full_name,
                                    platform_type=parsed_cpu_info['platform'],
                                    processor_family=parsed_cpu_info['processor_family'],
                                    processor_number=parsed_cpu_info['processor_number'],
                                    cores_number=result.cpu_cores_number,
                                    frequency=result.cpu_frequency)
            cpu_info.write_record(session)
            remote_target.cpu_info_id = cpu_info.id
            remote_target.write_record(session)
        if not warning:
            self.on_success()

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready,
                                             log='Setup process successfully finished.')

    def set_warning(self, warning_message: str):
        self._job_state_subject.update_state(status=StatusEnum.warning, warning_message=warning_message)
