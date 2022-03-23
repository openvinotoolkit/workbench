"""
 OpenVINO DL Workbench
 Class for run console tool in local target

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

from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser
from wb.main.console_tool_wrapper.console_tool import ConsoleTool
from wb.main.jobs.tools_runner.console_runner import ConsoleRunner
from wb.main.jobs.tools_runner.local_runner import LocalRunner
from wb.main.jobs.tools_runner.remote_runner import RemoteRunner
from wb.main.jobs.tools_runner.wb_ssh_client import WBSSHClient
from wb.main.enumerates import TargetTypeEnum
from wb.main.models.remote_target_model import RemoteTargetModel
from wb.main.models.target_model import TargetModel
from config.constants import JOBS_SCRIPTS_FOLDER


def create_runner(target_id: int, tool: ConsoleTool, parser: ConsoleToolOutputParser,
                  session: Session, working_directory: str = None) -> ConsoleRunner:
    target = session.query(TargetModel).get(target_id)
    if target.target_type == TargetTypeEnum.local:
        working_directory = working_directory or os.path.dirname(JOBS_SCRIPTS_FOLDER)
        return LocalRunner(tool, parser, working_directory)
    if target.target_type == TargetTypeEnum.remote:
        remote_target = session.query(RemoteTargetModel).get(target_id)
        wb_ssh_client = WBSSHClient(remote_target.host,
                                    remote_target.username,
                                    private_key_path=remote_target.private_key_path,
                                    port=remote_target.port)
        return RemoteRunner(tool, parser, wb_ssh_client, working_directory)
    raise Exception(f'Cannot find target with id {target_id}')
