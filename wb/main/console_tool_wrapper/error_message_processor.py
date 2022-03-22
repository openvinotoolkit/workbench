"""
 OpenVINO DL Workbench
 Interfaces class for error processing classes

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
from typing import Optional


class ErrorMessageProcessor:
    general_ie_error_pattern = re.compile(r'(?:\[ ERROR \] (?P<error_message>.*))')

    @staticmethod
    def _broken_device_message(device_name: str) -> str:
        return f'Cannot infer this model on {device_name}. ' \
               'Possible causes: Drivers setup failed. Update the drivers or run inference on a CPU.'

    @staticmethod
    def _unsupported_model(device_name: str = 'this device'):
        return f'Cannot infer this model on {device_name}. ' \
               'Possible causes: The device does not support some layers of this model. Try to run inference on a CPU.'

    match_error = {
        'Failed to create plugin .* for device GPU':
            _broken_device_message.__func__('Intel(R) Processor Graphics (GPU)'),
        'Can not init Myriad device: NC_ERROR':
            _broken_device_message.__func__('Intel(R) Movidius(TM) Neural Compute Stick 2 (NCS 2)'),
        'Event sending failed':
            _broken_device_message.__func__('Intel(R) Movidius(TM) Neural Compute Stick 2 (NCS 2)'),
        'Unknown Layer Type:':
            _unsupported_model.__func__(),
    }

    @staticmethod
    def _general_error(stage: str = None) -> str:
        if stage:
            return 'Failed in the stage {}'.format(stage)
        return 'Inference Engine failed with unrecognized error'

    @staticmethod
    def _recognize_general_ie_message(error_message: str) -> Optional[str]:
        error_match = ErrorMessageProcessor.general_ie_error_pattern.search(error_message)
        return error_match.group('error_message') if error_match else None

    @classmethod
    def _find_message(cls, error_message: str) -> Optional[str]:
        for pattern, message in cls.match_error.items():
            pattern = r'.*'.join(pattern.lower().split(' '))
            if re.search(r'.*{s}.*'.format(s=pattern), error_message.lower()):
                return message
        return None

    @classmethod
    def recognize_error(cls, error_message: str, stage: str = None) -> str:
        message = cls._find_message(error_message)
        if message:
            return message
        message = ErrorMessageProcessor._recognize_general_ie_message(error_message)
        if message:
            return message
        message = cls._general_error(stage)
        return message
