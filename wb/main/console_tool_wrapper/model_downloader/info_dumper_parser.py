"""
 OpenVINO DL Workbench
 Class for cli output of calibration tool

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

from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser


class InfoDumperParser(ConsoleToolOutputParser):

    def __init__(self):
        ConsoleToolOutputParser.__init__(self, None, None)

    def parse(self, string: str):
        self.stdout += string
