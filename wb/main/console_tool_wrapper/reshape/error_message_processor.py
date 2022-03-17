"""
 OpenVINO DL Workbench
 Class for processing errors of the reshape.py script

 Copyright (c) 2022 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
import re
from copy import deepcopy
from typing import TypedDict, Dict, List, Optional

from wb.main.console_tool_wrapper.error_message_processor import ErrorMessageProcessor
from wb.main.enumerates import ModelDomainEnum


class ErrorDetails(TypedDict):
    reason: str
    solution: str


class InputConfig(TypedDict):
    shape: List[int]
    layout: List[str]


INPUT_CONFIGURATION_TYPE = Dict[str, InputConfig]


class InputsConfigurationManager:

    def __init__(self, shape_configuration: list, layout_configuration: list):
        self._inputs_configuration = self._combine_shape_layout(shape_configuration, layout_configuration)

    @staticmethod
    def _combine_shape_layout(shape_configuration: list, layout_configuration: list) -> INPUT_CONFIGURATION_TYPE:
        return {
            shape_item['name']: {
                'shape': shape_item['shape'],
                'layout': layout_configuration[i]['layout']
            }
            for i, shape_item in enumerate(shape_configuration)
        }

    def get_inputs_configuration_string(self, input_configuration: INPUT_CONFIGURATION_TYPE = None) -> str:
        input_configuration = input_configuration or self._inputs_configuration
        inputs = []
        for name, input_config in input_configuration.items():
            shape = ','.join(str(i) for i in input_config['shape'])
            shape = '{' + shape + '}'
            inputs.append(f'{name}{shape}')
        return ', '.join(inputs)

    @property
    def has_high_or_width_in_layout(self) -> bool:
        return self._has_value_in_layout(value='H') or self._has_value_in_layout(value='W')

    @property
    def has_two_inputs(self) -> bool:
        return len(self._inputs_configuration.keys()) == 2

    @property
    def image_info_name(self) -> Optional[str]:
        for name, input_config in self._inputs_configuration.items():
            if len(input_config['shape']) == 2:
                return name
        return None

    def _has_value_in_layout(self, value: str) -> bool:
        for input_config in self._inputs_configuration.values():
            layout = input_config['layout']
            if value in layout:
                return True
        return False

    @property
    def inputs_configuration_with_3_channels(self) -> str:
        input_configuration = deepcopy(self._inputs_configuration)
        for name, input_config in input_configuration.items():
            if 'C' not in input_config['layout']:
                continue
            c_index = input_config['layout'].index('C')
            input_config['shape'][c_index] = 3

        return self.get_inputs_configuration_string(input_configuration)

    @property
    def inputs_configuration_with_increased_image_size(self) -> str:
        input_configuration = deepcopy(self._inputs_configuration)
        for name, input_config in input_configuration.items():
            if 'H' in input_config['layout']:
                index = input_config['layout'].index('H')
                h_dim = input_config['shape'][index]
                input_config['shape'][index] = h_dim * 2
            if 'W' in input_config['layout']:
                index = input_config['layout'].index('W')
                w_dim = input_config['shape'][index]
                input_config['shape'][index] = w_dim * 2

        return self.get_inputs_configuration_string(input_configuration)

    @property
    def adjusted_nlp_inputs_configuration(self) -> str:
        input_configuration = deepcopy(self._inputs_configuration)
        second_dims = []

        c_index = 1

        for input_config in input_configuration.values():
            if len(input_config['shape']) < 2:
                continue
            if 'C' in input_config['layout']:
                c_index = input_config['layout'].index('C')

            second_dims.append(input_config['shape'][c_index])

        max_s = max(second_dims)
        for input_config in input_configuration.values():
            input_config['shape'][c_index] = max_s
        return self.get_inputs_configuration_string(input_configuration)

    @property
    def image_info_with_right_shape(self) -> str:
        input_configuration = deepcopy(self._inputs_configuration)
        for name, input_config in input_configuration.items():
            if len(input_config['shape']) != 2:
                continue
            c_index = 1
            if 'C' in input_config['layout']:
                c_index = input_config['layout'].index('C')
            input_config['shape'][c_index] = 3
        return self.get_inputs_configuration_string(input_configuration)


class ReshapeErrorMessageProcessor(ErrorMessageProcessor):
    def __init__(self, shape_configuration: list, layout_configuration: list, domain: ModelDomainEnum):
        self._input_configuration_manager = InputsConfigurationManager(shape_configuration, layout_configuration)
        self._domain = domain
        self._raw_error_pattern_to_message = {
            re.compile(r'.*Data batch channel count \(\d\) does not match filter input channel count \(\d\).*'):
                self._wrong_channel_count_error_details,
            re.compile(r'.*(larger than the data shape|Argument shapes are inconsistent).*'):
                self._inconsistency_shape_error_details,
            re.compile(r'.*Image_shape 1D tensor must have.*'):
                self._inconsistency_image_info_error_details
        }

    def recognize_error(self, logs: str, *args) -> str:
        message = self._common_error_details
        for pattern, get_detailed_message in self._raw_error_pattern_to_message.items():
            if pattern.search(logs):
                message = get_detailed_message
                break

        return self._build_full_message(message['reason'], message['solution'], logs)

    def _build_full_message(self, reason, solution, logs) -> str:
        input_configuration = self._input_configuration_manager.get_inputs_configuration_string()
        return f'''Summary: model inputs cannot be reshaped to the requested shape: {input_configuration}.
Reason: {reason}
Possible solution: {solution}

Job log:

{logs}
'''

    @property
    def _wrong_channel_count_error_details(self) -> ErrorDetails:
        solution = 'try to specify another channels count when providing inputs shape'
        if self._input_configuration_manager.has_high_or_width_in_layout:
            current = self._input_configuration_manager.get_inputs_configuration_string()
            advise = self._input_configuration_manager.inputs_configuration_with_3_channels
            solution += f', for example, {advise} instead of {current}.'
        return ErrorDetails(
            reason='your model inputs cannot process the specified channels count',
            solution=solution
        )

    @property
    def _inconsistency_shape_error_details(self) -> ErrorDetails:
        if self._domain == ModelDomainEnum.NLP:
            return self._inconsistent_nlp_shape_error_details
        if self._input_configuration_manager.has_high_or_width_in_layout:
            return self._inconsistent_cv_shape_error_details

        return self._common_error_details

    @property
    def _inconsistent_cv_shape_error_details(self) -> ErrorDetails:
        current = self._input_configuration_manager.get_inputs_configuration_string()
        advise = self._input_configuration_manager.inputs_configuration_with_increased_image_size
        input_info = self._input_configuration_manager.image_info_name
        if input_info is None:
            input_info = 'image information'
        solution = f'try to specify another shape for the {input_info} input, ' \
                   f'for example, {advise} instead of {current}.'
        return ErrorDetails(
            reason='requested model inputs shapes cannot be applied due to their inconsistency.',
            solution=solution
        )

    @property
    def _inconsistent_nlp_shape_error_details(self) -> ErrorDetails:
        current = self._input_configuration_manager.get_inputs_configuration_string()
        advise = self._input_configuration_manager.adjusted_nlp_inputs_configuration

        solution = 'try to specify the same input shape for each input, ' \
                   f'for example, {advise} instead of {current}.'
        return ErrorDetails(
            reason='specified model inputs shapes cannot be applied due to their inconsistency.',
            solution=solution
        )

    @property
    def _inconsistency_image_info_error_details(self) -> ErrorDetails:
        solution = 'try to specify another channels count when providing inputs shape'
        if self._input_configuration_manager.has_two_inputs and self._input_configuration_manager.image_info_name:
            current = self._input_configuration_manager.get_inputs_configuration_string()
            advise = self._input_configuration_manager.image_info_with_right_shape
            solution += f', for example, {advise} instead of {current}.'
        return ErrorDetails(
            reason='specified model inputs shapes cannot be applied due to their inconsistency.',
            solution=solution
        )

    @property
    def _common_error_details(self) -> ErrorDetails:
        return ErrorDetails(
            reason='specified model inputs shapes cannot be applied due to model topology specifics.',
            solution='try another shape configuration.'
        )
