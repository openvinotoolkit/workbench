"""
 OpenVINO DL Workbench
 Class for sanitize parameters of console tools

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
import re
from enum import Enum
from typing import Union, Iterable

from wb.error.sanitize_parameter_error import SanitizeParameterError
from wb.main.enumerates import (BenchmarkAppReportTypesEnum, DeploymentTargetEnum, DeviceTypeEnum,
                                ModelPrecisionEnum, SupportedFrameworksEnum)
from wb.main.shared.enumerates import DatasetTypesEnum


class ConsoleParametersTypes(Enum):
    accuracy_config = 'accuracy_config'
    benchmark_report = 'benchmark_report'
    constant = 'constant'
    dataset_format = 'dataset_format'
    deployment_manager_targets = 'deployment_manager_targets'
    device = 'device'
    echo = 'echo'
    filename = 'filename'
    flag = 'flag'
    framework = 'framework'
    input = 'input'
    input_placeholder = 'input_placeholder'
    input_shape = 'input_shape'
    integer = 'integer'
    list_devices = 'list_devices'
    mean_scale_values = 'mean_scale_values'
    path = 'path'
    url = 'url'
    precision = 'precision'
    layout = 'layout'


class RegexPatterns(Enum):
    input_name = r'[\w\d\.\:\/]+'
    value_list = r'\[[^,]+\]'
    number_list = r'\[(-?\d+\s?)+\]'
    bool_value = r'True|False'
    input_shape = fr'{input_name}{number_list}'
    placeholder = fr'((->)({bool_value}|{value_list}))'


# pylint: disable=too-many-public-methods
class ConsoleParameterValidator:

    def __init__(self, parameter_type: ConsoleParametersTypes, values: Iterable = ()):
        self.parameter_type = parameter_type
        self.values = values
        self.validator = self.get_validator(parameter_type)

    def get_validator(self, parameter_type: ConsoleParametersTypes):
        validators = {
            ConsoleParametersTypes.accuracy_config: self.accuracy_config,
            ConsoleParametersTypes.benchmark_report: self.benchmark_report,
            ConsoleParametersTypes.constant: lambda v: self.constant_from(v, self.values),
            ConsoleParametersTypes.dataset_format: self.dataset_format,
            ConsoleParametersTypes.deployment_manager_targets: self.deployment_manager_targets,
            ConsoleParametersTypes.device: self.device,
            ConsoleParametersTypes.echo: self.echo,
            ConsoleParametersTypes.filename: self.filename,
            ConsoleParametersTypes.flag: self.flag,
            ConsoleParametersTypes.framework: self.framework,
            ConsoleParametersTypes.input: self.input,
            ConsoleParametersTypes.input_placeholder: self.input_placeholder,
            ConsoleParametersTypes.input_shape: self.input_shape,
            ConsoleParametersTypes.integer: self.integer,
            ConsoleParametersTypes.list_devices: self.list_devices,
            ConsoleParametersTypes.mean_scale_values: self.mean_scale_values,
            ConsoleParametersTypes.path: self.path,
            ConsoleParametersTypes.precision: self.precision,
            ConsoleParametersTypes.url: self.url,
            ConsoleParametersTypes.layout: self.layout,
        }
        return validators.get(parameter_type)

    def validate(self, value):
        self.validator(value)

    @staticmethod
    def accuracy_config(value: str):
        json_config = json.loads(value)
        if 'models' not in json_config:
            raise SanitizeParameterError(value)
        model = json_config['models'][0]
        if 'datasets' not in model:
            raise SanitizeParameterError(value)
        dataset = model['datasets'][0]
        if 'metrics' not in dataset:
            raise SanitizeParameterError(value)

    @staticmethod
    def benchmark_report(value: str):
        try:
            BenchmarkAppReportTypesEnum(value)
        except ValueError:
            raise SanitizeParameterError(value)

    @staticmethod
    def constant_from(value: str, values: Iterable):
        if value not in values:
            raise SanitizeParameterError(value)

    @staticmethod
    def dataset_format(value: str):
        try:
            DatasetTypesEnum(value)
        except ValueError:
            raise SanitizeParameterError(value)

    @staticmethod
    def deployment_manager_targets(value: str):
        try:
            (DeploymentTargetEnum(target) for target in value)
        except TypeError:
            raise SanitizeParameterError(value)

    @staticmethod
    def device(value: str):
        try:
            DeviceTypeEnum(value)
        except TypeError:
            raise SanitizeParameterError(value)

    @staticmethod
    def echo(value: str):
        ConsoleParameterValidator.validate_by_pattern(value=value, pattern=r'[a-zA-Z0-9\s]+\$[a-zA-Z0-9]*\??$')

    @staticmethod
    def filename(value: str):
        pattern = r'^[^*&%]+$'
        if not re.match(pattern, value):
            raise SanitizeParameterError(value)

    @staticmethod
    def flag(value: bool):
        if value is not True:
            raise SanitizeParameterError(str(value))

    @staticmethod
    def framework(value: str):
        try:
            SupportedFrameworksEnum(value)
        except ValueError:
            raise SanitizeParameterError(value)

    @staticmethod
    def input_shape(value: str):
        ConsoleParameterValidator.validate_by_pattern(value=value, pattern=r'\[(\d+,?)+\]')

    # TODO: 53535
    @staticmethod
    def input_placeholder(value: str):
        pattern = fr'{RegexPatterns.input_name.value}{RegexPatterns.placeholder.value},?'
        ConsoleParameterValidator.validate_by_pattern(value=value, pattern=pattern)

    # TODO: 53535
    @staticmethod
    def input(value: str):
        pattern = fr'{RegexPatterns.input_shape.value}{RegexPatterns.placeholder.value}?,?'
        ConsoleParameterValidator.validate_by_pattern(value=value, pattern=pattern)

    @staticmethod
    def integer(value: Union[str, int]):
        try:
            int(value)
        except TypeError:
            raise SanitizeParameterError(value)

    @staticmethod
    def list_devices(value: str):
        try:
            for device in value:
                DeploymentTargetEnum(device.upper())
        except ValueError:
            raise SanitizeParameterError(value)

    @staticmethod
    def mean_scale_values(value: str):
        pattern = fr'{RegexPatterns.input_name.value}\[(-?\d+\.\d+,?)+\]'
        ConsoleParameterValidator.validate_by_pattern(value=value, pattern=pattern)

    @staticmethod
    def path(value: str):
        ConsoleParameterValidator.validate_by_pattern(value=str(value), pattern=r'^(.+)\/?([^/]+)$')

    @staticmethod
    def precision(value: str):
        try:
            ModelPrecisionEnum(value)
        except ValueError:
            raise SanitizeParameterError(value)

    @staticmethod
    def url(value: str):
        ConsoleParameterValidator.validate_by_pattern(value=value,
                                                      pattern=r'(?i)\b((?:https?://|www\d{0,3}[.]|[a-z0-9.\-]'
                                                              r'+[.][a-z]{2,4}/)(?:[^\s()<>]+|\(([^\s()<>]+|'
                                                              r'(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\))'
                                                              r')*\)|[^\s`!()\[\]{};:\'".,<>?«»“”‘’]))')

    @staticmethod
    def layout(value: str):
        pattern = r'([\w.]+\d?]?\([\w?]+\),?)+'
        ConsoleParameterValidator.validate_by_pattern(value=value, pattern=pattern)

    @staticmethod
    def validate_by_pattern(value: str, pattern: str):
        if not re.match(pattern, value):
            raise SanitizeParameterError(value)
