"""
 OpenVINO DL Workbench
 Interfaces class for error processing classes

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
