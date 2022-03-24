"""
 OpenVINO DL Workbench
 Class for parameters of standard bash tools: rm, mkdir e.t.c.

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
import re
from typing import Match

from wb.main.console_tool_wrapper.console_parameter_validator import ConsoleParametersTypes
from wb.main.console_tool_wrapper.console_tool import ConsoleTool


class ShTool(ConsoleTool):
    def __init__(self, command: str, parameters: list = None, environment: dict = None):
        super().__init__(parameters, environment)
        self.exe = command
        self.parameter_prefix = '-'

    def set_openvino_package_root_parameter(self, value: str):
        self.set_parameter(name='openvino-package-root', value=value, parameter_type=ConsoleParametersTypes.path)


# pylint: disable=invalid-name
class SetupTargetToolResult:
    os: str
    has_root_privileges: bool
    has_internet_connection: bool
    python_version: str
    pip_version: str
    home_directory: str
    cpu_full_name: str
    cpu_cores_number: int
    cpu_frequency: str


class SetupTargetTool(ShTool):
    has_internet_connection = re.compile(r'(The target has internet connection\.)')
    has_root_privileges = re.compile(r'(The current user has root privileges\.)')
    python_found_message = re.compile(r'(?:Python (?P<python_version>\d\.\d) is supported\.)')
    pip_found_message = re.compile(r'(?:Pip (?P<pip_version>(\d.?)+) is supported\.)')
    os_message = re.compile(r'(?:(?P<os>.*) is supported\.)')
    home_directory_message = re.compile(r'(?:The home directory is (?P<home_directory>\/([\w]+\/?)+)\.)')
    full_cpu_name_message = re.compile(r'(?:Full CPU name is (?P<cpu_name>.*))')
    cpu_cores_message = re.compile(r'(?:CPU cores number: (?P<cpu_cores>\d))')
    cpu_frequency_range_message = re.compile(r'(?:CPU frequency range: (?P<cpu_frequency>\d\.\d(-\d\.\d)?\sGHz))')

    @staticmethod
    def parse_tool_output(output: str) -> SetupTargetToolResult:
        result = SetupTargetToolResult()

        result.has_internet_connection = bool(SetupTargetTool.has_internet_connection.findall(output))
        result.has_root_privileges = bool(SetupTargetTool.has_root_privileges.findall(output))

        python_found_message: Match = SetupTargetTool.python_found_message.search(output)
        result.python_version = python_found_message.group('python_version') if python_found_message else None

        pip_found_message: Match = SetupTargetTool.pip_found_message.search(output)
        result.pip_version = pip_found_message.group('pip_version') if pip_found_message else None

        os_message: Match = SetupTargetTool.os_message.search(output)
        result.os = os_message.group('os') if os_message else None

        home_directory_message: Match = SetupTargetTool.home_directory_message.search(output)
        result.home_directory = home_directory_message.group('home_directory') if home_directory_message else None

        full_cpu_name_message: Match = SetupTargetTool.full_cpu_name_message.search(output)
        result.cpu_full_name = full_cpu_name_message.group('cpu_name')

        cpu_cores_message: Match = SetupTargetTool.cpu_cores_message.search(output)
        result.cpu_cores_number = int(cpu_cores_message.group('cpu_cores'))

        cpu_frequency_range_message: Match = SetupTargetTool.cpu_frequency_range_message.search(output)
        result.cpu_frequency = cpu_frequency_range_message.group('cpu_frequency')
        return result


class PingTargetTool(ShTool):
    def set_output_path_parameter(self, value: str):
        self.set_parameter(name='output', value=value, parameter_type=ConsoleParametersTypes.path)

    @property
    def get_output_parameter_value(self) -> str:
        return self.get_parameter_value('output')


class TarGzTool(ConsoleTool):
    def __init__(self, archive_path: str, destination_path: str = None):
        super().__init__([
            dict(name='xfp', value=archive_path, parameter_type=ConsoleParametersTypes.path)
        ])
        self.exe = 'tar'
        self.parameter_prefix = ''
        if destination_path:
            self.set_parameter(name='-C', value=destination_path, parameter_type=ConsoleParametersTypes.path)


class ZIPTool(ConsoleTool):
    def __init__(self, archive_path: str, destination_path: str):
        super().__init__([
            dict(name='o', value=archive_path, parameter_type=ConsoleParametersTypes.path),
            dict(name='d', value=destination_path, parameter_type=ConsoleParametersTypes.path)
        ])
        self.exe = 'unzip'


class RMTool(ConsoleTool):
    def __init__(self, path: str):
        super().__init__([
            dict(name='rf', value=path, parameter_type=ConsoleParametersTypes.path)
        ])
        self.exe = 'rm'


class MKDirTool(ConsoleTool):
    def __init__(self, path: str):
        super().__init__([
            dict(name='p', value=path, parameter_type=ConsoleParametersTypes.path)
        ])
        self.exe = 'mkdir'


class EchoTool(ConsoleTool):
    def __init__(self, string: str):
        super().__init__([
            dict(name='', value=string, parameter_type=ConsoleParametersTypes.echo)
        ])
        self.exe = 'echo'

    @property
    def console_command(self) -> str:
        self.validate()
        params = ' '.join([param.value for param in self.params])
        return '{exe} "{params}"'.format(exe=self.exe, params=params)


class KillTool(ConsoleTool):
    def __init__(self, tool: ConsoleTool):
        super().__init__()
        process_to_kill = tool.console_command
        self.exe = ' | '.join(('ps axf',
                               f'grep "{process_to_kill}"',
                               'grep -v grep',
                               'awk \'{print "kill -9 " $1}\' | sh'))
