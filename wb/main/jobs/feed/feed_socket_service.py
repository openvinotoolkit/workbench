"""
 OpenVINO DL Workbench
 Class for inference emit message

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

from wb.extensions_factories.socket_io import get_socket_io
from wb.main.enumerates import SocketNamespacesEnum, SocketEventsEnum


class FeedSocketService:
    namespace = SocketNamespacesEnum.feed.value
    event = SocketEventsEnum.events.value
    socket_io = get_socket_io()

    @staticmethod
    def emit(code: int, message: str, details: str = ''):
        message = {
            'code': code,
            'message': message,
            'details': details,
        }
        FeedSocketService.socket_io.emit(FeedSocketService.event, message, namespace=FeedSocketService.namespace)
        FeedSocketService.socket_io.sleep(0)
