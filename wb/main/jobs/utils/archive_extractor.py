"""
 OpenVINO DL Workbench
 Class for extracting tar and zip archives

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

from wb.error.job_error import ArtifactError
from wb.main.console_tool_wrapper.sh_tools.parser import ExtractParser
from wb.main.console_tool_wrapper.sh_tools.tools import ZIPTool, TarGzTool
from wb.main.enumerates import StatusEnum
from wb.main.jobs.tools_runner.local_runner import LocalRunner
from wb.main.shared.constants import VOC_ROOT_FOLDER
from wb.main.utils.utils import create_empty_dir
from wb.main.jobs.interfaces.ijob import IJob


class Extractor:
    def __init__(self, file_id: int, file_name: str, file_path: str, job: IJob, extract_path: str):
        self.file_id = file_id
        self.file_name = file_name
        self.file_path = file_path
        self.job = job
        self.extract_path = extract_path

    def extract_archive(self):
        target_path = os.path.join(self.extract_path, str(self.file_id))
        self.job.job_state_subject.update_state(status=StatusEnum.running, progress=10)
        create_empty_dir(target_path)
        _, file_extension = os.path.splitext(self.file_name)
        parser = ExtractParser(self.job.job_state_subject)
        if file_extension in ('.gz', '.tar', '.tar.gz'):
            unpacker = TarGzTool(archive_path=self.file_path, destination_path=target_path)
        elif file_extension == '.zip':
            unpacker = ZIPTool(archive_path=self.file_path, destination_path=target_path)
        else:
            message = 'Unsupported type of archive. Supported archives extensions: gz, tar, tar.gz, zip'
            self.job.job_state_subject.update_state(status=StatusEnum.error, error_message=message)
            raise ArtifactError(message, 1)
        runner = LocalRunner(unpacker, parser)
        _, err = runner.run_console_tool(self.job)
        self.handle_archived_dir(target_path)
        if err != 'cancelled':
            self.job.job_state_subject.update_state(status=StatusEnum.ready, progress=100)

    def handle_archived_dir(self, target_path):
        """Handle archives containing a directory."""
        contents = os.listdir(target_path)
        if len(contents) == 1 and os.path.isdir(os.path.join(target_path, contents[0])):
            if contents[0] == VOC_ROOT_FOLDER:
                return
            temporary_path = os.path.join(self.extract_path, 'temporary_directory')
            os.rename(target_path, temporary_path)
            os.rename(os.path.join(temporary_path, contents[0]), target_path)
            os.rmdir(temporary_path)
