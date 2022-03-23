"""
 OpenVINO DL Workbench
 Workbench logs handler

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
import os
import logging
from logging.handlers import RotatingFileHandler

from config.constants import LOG_FILE, LOG_LEVEL


class WorkbenchLoggingFileHandler(RotatingFileHandler):
    def __init__(self, filename: str):
        super().__init__(filename=filename,
                         maxBytes=2 * 1024 * 1024,  # 2 mb
                         backupCount=1)

    def doRollover(self):
        half_of_max_size = self.maxBytes // 2
        current_file_size = os.path.getsize(self.baseFilename)
        if current_file_size < half_of_max_size:
            return
        try:
            with open(self.baseFilename, 'rb') as file_descriptor:
                file_descriptor.seek(-half_of_max_size, 2)
                lines = file_descriptor.read()
            with open(self.baseFilename, 'wb') as file_descriptor:
                file_descriptor.write(lines)
        except IOError:
            pass


def initialize_workbench_logger():
    if LOG_FILE:
        handler = WorkbenchLoggingFileHandler(filename=LOG_FILE)
    else:
        handler = logging.StreamHandler()
    logger = logging.getLogger()
    logger.setLevel(LOG_LEVEL)
    logger.handlers = []
    logger.addHandler(handler)
