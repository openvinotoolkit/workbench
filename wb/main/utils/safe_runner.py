"""
 OpenVINO DL Workbench
 Functions for handling errors and safety running functions

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

import logging as log
from functools import wraps

from sqlalchemy.exc import SQLAlchemyError

from wb.error.code_registry import CodeRegistry
from wb.error.general_error import GeneralError
from wb.main.jobs.feed.feed_socket_service import FeedSocketService


def safe_run_configurable(emit_web_socket: bool = True):
    def decorator(func):
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

            if emit_web_socket:
                FeedSocketService.emit(error_code, message)
            return message, error_code

        return decorated_function

    return decorator


def safe_run(func):
    return safe_run_configurable(emit_web_socket=True)(func)


def log_traceback(error):
    exc_info = (type(error), error, error.__traceback__)
    log.error('Server Exception', exc_info=exc_info)
