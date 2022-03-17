"""
 OpenVINO DL Workbench
 Class for running console tool in remote target

 Copyright (c) 2018 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
