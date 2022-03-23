"""
 OpenVINO DL Workbench
 Class for getting system resources job

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
import json
import os
from contextlib import closing

from wb.error.job_error import SetupTargetError
from wb.main.console_tool_wrapper.sh_tools.parser import ShParser
from wb.main.console_tool_wrapper.sh_tools.tools import PingTargetTool
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.enumerates import JobTypesEnum
from wb.main.jobs.tools_runner.runner_creator import create_runner
from wb.main.jobs.utils.utils import collect_artifacts, fill_ping_parameters
from wb.main.enumerates import StatusEnum

from wb.main.models.get_system_resources_job_model import GetSystemResourcesJobModel
from wb.main.models.target_model import TargetModel
from config.constants import DATA_FOLDER


class GetSystemResourcesJob(IJob):
    job_type = JobTypesEnum.get_system_resources_type

    _job_model_class = GetSystemResourcesJobModel

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running,
                                             log='Collecting information about system resources on the remote target.')

        parser = ShParser(self._job_state_subject)
        tool = PingTargetTool(os.path.join('./scripts', 'get_system_resources.sh'))
        with closing(get_db_session_for_celery()) as session:
            get_system_resources_job = self.get_job_model(session)
            bundle_path = get_system_resources_job.target.bundle_path
            target_id = get_system_resources_job.target_id
            runner = create_runner(target_id=target_id, tool=tool,
                                   parser=parser, session=session,
                                   working_directory=bundle_path)
            artifact_name = 'SYSTEM_RESOURCES.json'
            fill_ping_parameters(target_id, tool, session, artifact_name)

        output_file = tool.get_output_parameter_value

        return_code, message = runner.run_console_tool(self)
        if return_code:
            self.fail_script(message)
        dest_path = os.path.join(DATA_FOLDER, 'targets', str(target_id), artifact_name)
        session = get_db_session_for_celery()
        with closing(session):
            collect_artifacts(target_id, output_file, dest_path, session)
            with open(os.path.join(dest_path)) as system_resources_file:
                system_resources_info = json.load(system_resources_file)

            target = session.query(TargetModel).get(target_id)
            system_resources = target.system_resources
            self._job_state_subject.update_state(log='Saving information about system resources.')
            system_resources.update(system_resources_info, session)
            system_resources.write_record(session)
            target.system_resources_id = system_resources.id
            target.write_record(session)
        self.on_success()


    def fail_script(self, message: str):
        raise SetupTargetError('Cannot collect system resources of the remote target.', self._job_id)

    def on_success(self):
        session = get_db_session_for_celery()
        with closing(session):
            self._job_state_subject.update_state(status=StatusEnum.ready,
                                                 log='Collecting of system information successfully finished.')
            self._job_state_subject.detach_all_observers()
