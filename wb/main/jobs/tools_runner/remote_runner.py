"""
 OpenVINO DL Workbench
 Class for running console tool in remote target

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
from typing import Tuple

from wb.main.console_tool_wrapper.console_tool import ConsoleTool
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser
from wb.main.jobs.tools_runner.console_runner import ConsoleRunner
from wb.main.jobs.tools_runner.wb_ssh_client import WBSSHClient


class RemoteRunner(ConsoleRunner):
    def __init__(self, tool: ConsoleTool,
                 parser: ConsoleToolOutputParser,
                 wb_ssh_client: WBSSHClient,
                 working_directory: str):
        super().__init__(tool, parser)
        self.wb_ssh_client = wb_ssh_client
        self.working_directory = working_directory

    def run_console_tool(self, unused_job: IJob = None, measure_performance: bool = False) -> Tuple[int, str]:
        with self.wb_ssh_client:
            exit_status, ssh_out = self.wb_ssh_client.execute(self.tool.console_command,
                                                              working_directory=self.working_directory,
                                                              environment=self.tool.environment,
                                                              output_processor=self.parser)
        return exit_status, ssh_out
