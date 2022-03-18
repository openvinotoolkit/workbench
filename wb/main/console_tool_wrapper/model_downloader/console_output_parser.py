"""
 OpenVINO DL Workbench
 Class for parsing output of Model Downloader

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
import json

from wb.error.job_error import ModelDownloaderError
from wb.main.enumerates import StatusEnum
from wb.main.jobs.interfaces.job_state import JobStateSubject
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser, skip_empty_line_decorator


class DownloadingFile:
    def __init__(self, name: str, size: float):
        self.name = name
        self.size = size
        self.download_progress = 0


class ModelDownloaderParser(ConsoleToolOutputParser):
    def __init__(self, job_state_subject: JobStateSubject, downloading_files=None, total_files: int = None):
        super().__init__(job_state_subject=job_state_subject)
        self.buffer = ''
        if downloading_files is None:
            downloading_files = []
        self._downloading_files = downloading_files
        self._total_files = total_files

    @skip_empty_line_decorator
    def parse(self, string: str):
        self.stdout += ('\n' + string)

        if '[ WARNING ]' in string:
            return

        # Handle multi-line JSONs.
        try:
            console_status = json.loads(string)
            if isinstance(console_status, str):
                raise json.decoder.JSONDecodeError(f'Bad JSON format: {string}', string, 0)
            self.buffer = ''
        except json.decoder.JSONDecodeError:
            self.buffer += string
            try:
                console_status = json.loads(self.buffer)
                self.buffer = ''
            except json.decoder.JSONDecodeError:
                return

        type_stage = console_status['$type']
        if type_stage.startswith('model_'):
            method = getattr(self, type_stage, None)
            if method:
                if 'postprocessing' in type_stage:
                    method()
                else:
                    method(console_status)

    def get_downloading_file(self, name: str) -> DownloadingFile:
        return next(file for file in self._downloading_files if file.name == name)

    def model_download_begin(self, console_status: dict):
        self._total_files = console_status['num_files']

    def model_file_download_begin(self, console_status: dict):
        new_file_name = console_status['model_file']
        file_size = console_status['size']
        self._job_state_subject.update_state(log='Downloading {}'.format(new_file_name))
        downloading_file = DownloadingFile(name=new_file_name, size=file_size)
        self._downloading_files.append(downloading_file)

    def model_file_download_progress(self, console_status: dict):
        file_name = console_status['model_file']
        downloaded_size = console_status['size']
        file = self.get_downloading_file(file_name)
        file.download_progress = (downloaded_size / file.size) * 100
        self.update_download_progress()

    def model_file_download_end(self, console_status: dict):
        file_name = console_status['model_file']
        file = self.get_downloading_file(file_name)
        file.download_progress = 100
        self.update_download_progress()

    def model_download_end(self, console_status: dict):
        if not console_status['successful']:
            error_message = 'Failed to download: {}'.format(console_status['model'])
            self._job_state_subject.update_state(status=StatusEnum.error, error_message=error_message)
            raise ModelDownloaderError(error_message, self._job_state_subject.job_id)
        for file in self._downloading_files:
            file.download_progress = 100
        self.update_download_progress()

    def update_download_progress(self):
        total_progress = sum(file.download_progress for file in self._downloading_files) / self._total_files
        self._job_state_subject.update_state(progress=total_progress)
