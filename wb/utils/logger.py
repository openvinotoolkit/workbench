"""
 OpenVINO DL Workbench
 Workbench logs handler

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
