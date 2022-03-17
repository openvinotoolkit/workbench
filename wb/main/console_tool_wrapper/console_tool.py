"""
 OpenVINO DL Workbench
 Interface class for manage console tool's

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
from typing import List, Optional

from wb.error.general_error import GeneralError
from wb.main.console_tool_wrapper.console_parameter import ConsoleToolParameter, ConsoleToolFlag, \
    ConsoleParametersTypes


class ConsoleTool:
    def __init__(self, parameters: list = None, environment: dict = None):
        self.params: List[ConsoleToolParameter] = []
        self.environment = environment
        self.parameter_prefix = '-'
        self.exe = None
        if parameters:
            self.set_parameters(parameters)

    def set_parameter(self, name: str, value=True,
                      parameter_type: ConsoleParametersTypes = None,
                      values: str = ()):
        if value is False:
            # No need to set flag if value is False
            return
        if value is True:
            # If value is True the parameter is flag
            self.params.append(ConsoleToolFlag(name))
        else:
            self.params.append(ConsoleToolParameter(name, value, parameter_type=parameter_type, values=values))

    def get_parameter_value(self, name: str) -> Optional[str]:
        parameter = list(filter(lambda p: p.name == name, self.params))
        return parameter[0].value if parameter else None

    def set_parameters(self, parameters: List[dict]):
        for parameter in parameters:
            self.set_parameter(parameter.get('name'), parameter.get('value', True), parameter.get('parameter_type'),
                               parameter.get('values'))

    @property
    def console_command(self) -> str:
        if not self.exe:
            raise GeneralError('Name of application to launch is not set')
        return f'{self.exe} {self.console_command_params}'

    @property
    def console_command_params(self) -> str:
        self.validate()
        return ' '.join([param.prepare_for_command_line(self.parameter_prefix) for param in self.params])

    def validate(self):
        for parameter in self.params:
            parameter.validate()
