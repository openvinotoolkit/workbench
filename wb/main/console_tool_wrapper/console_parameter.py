"""
 OpenVINO DL Workbench
 Interface classes for manage console tool's parameters

 Copyright (c) 2020 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
