"""
 OpenVINO DL Workbench
 Class for handling ssh connection

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
import os
from typing import Callable, Optional

from wb.main.jobs.tools_runner.wb_ssh_client import WBSSHClient


class WBSFTPClient:
    def __init__(self, ssh_client: WBSSHClient, log_callback: Optional[Callable[[str, float], None]] = None):
        self.ssh_client = ssh_client
        self._log_callback = log_callback
        self._last_logged_progress = 0
        self._log_progress_threshold = 10

    def copy_from_target(self, source_path: str, destination_path: str):
        destination_dir = os.path.dirname(destination_path)
        if not os.path.exists(destination_dir):
            os.makedirs(destination_dir)
        with self.ssh_client:
            with self.ssh_client.ssh_client.open_sftp() as sftp:
                sftp.get(source_path, destination_path)

    def copy_to_target(self, source_path: str, destination_path: str):
        with self.ssh_client:
            with self.ssh_client.ssh_client.open_sftp() as sftp:
                sftp.put(source_path, destination_path, callback=self.log_progress)

    def log_progress(self, bytes_sent: int, bytes_total: int):
        uploaded_percentage = bytes_sent / bytes_total * 100
        if uploaded_percentage < 100 and \
                uploaded_percentage < self._last_logged_progress + self._log_progress_threshold:
            return
        self._last_logged_progress = uploaded_percentage
        message = 'Copying to target: {:.2f}%'.format(uploaded_percentage)
        log.debug(message)
        if self._log_callback:
            self._log_callback(message, uploaded_percentage)
