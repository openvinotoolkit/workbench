"""
 OpenVINO DL Workbench
 Interface classes for manage console tool's parameters

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
from typing import Union

from wb.main.console_tool_wrapper.console_parameter_validator import ConsoleParametersTypes, ConsoleParameterValidator


class ConsoleToolParameter:
    def __init__(self, name: str, value: Union[int, str, bool, list],
                 parameter_type: ConsoleParametersTypes = None,
                 values: tuple = ()):
        self.name = name
        self.value = value
        self.validator = ConsoleParameterValidator(parameter_type, values)

    def prepare_for_command_line(self, prefix: str = '-'):
        escaped_value = self._escape(value=self.value)
        if self.name:
            name = f'{prefix}{self.name}'
            return f'{name} {escaped_value}'
        return escaped_value

    @staticmethod
    def _escape(value: str) -> str:
        if isinstance(value, (tuple, list)):
            return ' '.join(map(ConsoleToolParameter._escape_single_value, value))
        # pylint: disable=invalid-string-quote
        return f"'{ConsoleToolParameter._escape_single_value(value)}'"

    @staticmethod
    def _escape_single_value(value) -> str:
        # pylint: disable=invalid-string-quote
        return str(value).replace("'", r"'\''")

    def validate(self):
        self.validator.validate(self.value)


class ConsoleToolFlag(ConsoleToolParameter):
    def __init__(self, name: str, value: bool = True):
        super().__init__(name, value, parameter_type=ConsoleParametersTypes.flag)

    def prepare_for_command_line(self, prefix: str = '-') -> str:
        return '{pref}{name}'.format(pref=prefix, name=self.name) if self.value else ''
