"""
 OpenVINO DL Workbench
 Class for handling ssh connection

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
