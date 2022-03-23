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
import fcntl
import logging as log
import os
import shlex
import subprocess  # nosec: blacklist
from typing import Tuple

from wb.error.general_error import GeneralError
from wb.main.console_tool_wrapper.console_tool import ConsoleTool
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser
from wb.main.jobs.tools_runner.console_runner import ConsoleRunner


class LocalRunner(ConsoleRunner):
    def __init__(self,
                 tool: ConsoleTool,
                 parser: ConsoleToolOutputParser = None,
                 working_directory: str = None):
        super().__init__(tool, parser)
        self.working_directory = working_directory

    def run_console_tool(self, job: IJob = None, measure_performance=False) -> Tuple[int, str]:
        basename = os.path.basename(self.tool.exe)
        log.debug('RUN COMMAND: %s', self.tool.console_command)

        if basename not in self.allowed_tools:
            raise GeneralError(f'Unsupported command line tool: {basename}')
        command = shlex.split(self.tool.console_command)
        process = subprocess.Popen(command,  # nosec: subprocess_without_shell_equals_true
                                   stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                   env=self.tool.environment, cwd=self.working_directory)
        if not measure_performance:
            self.set_non_blocking(process.stdout)
        if job:
            job.subprocess.append(process.pid)

        message = []
        while True:
            output = process.stdout.readline().decode()
            if not output and process.poll() is not None:
                break
            if output and not output.isspace():
                message.append(output)
                log.debug(output)
            if self.parser:
                self.parser.parse(output.strip())

        return process.poll(), ''.join(message)

    @staticmethod
    def set_non_blocking(stream):
        """
        Without these flags any CLI tool blocks the STDIN/STDOUT and no-one can read it until the process finishes.
        DL Workbench reads the logs in real-time therefore we need those streams to be not blocked.
        """
        flags = fcntl.fcntl(stream, fcntl.F_GETFL)
        flags = flags | os.O_NONBLOCK
        fcntl.fcntl(stream, fcntl.F_SETFL, flags)
