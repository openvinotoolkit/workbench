"""
 OpenVINO DL Workbench
 Functions for handling errors and safety running functions

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

import logging as log
from functools import wraps

from sqlalchemy.exc import SQLAlchemyError

from wb.error.code_registry import CodeRegistry
from wb.error.general_error import GeneralError
from wb.main.jobs.feed.feed_socket_service import FeedSocketService


def safe_run(func):
    @wraps(func)
    def decorated_function(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except GeneralError as error:
            message = str(error)
            error_code = error.get_error_code()
            log_traceback(error)
        except SQLAlchemyError as error:
            message = 'Unable to update information in database'
            error_code = CodeRegistry.get_database_error_code()
            log_traceback(error)
        except Exception as error:
            error_code = 500
            message = str(error)
            log_traceback(error)

        FeedSocketService.emit(error_code, message)
        return message, error_code

    return decorated_function


def log_traceback(error):
    exc_info = (type(error), error, error.__traceback__)
    log.error('Server Exception', exc_info=exc_info)
