"""
 OpenVINO DL Workbench
 Huggingface model downloader

 Copyright (c) 2022 Intel Corporation

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
from pathlib import Path

from wb.error.job_error import HuggingFaceONNXConvertorError
from wb.main.console_tool_wrapper.console_parameter_validator import ConsoleParametersTypes
from wb.main.console_tool_wrapper.python_console_tool import PythonModuleTool
from wb.main.jobs.interfaces.job_state import JobStateSubject
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser, skip_empty_line_decorator


DOWNLOAD_PROGRESS_STRING_START = "Downloading:"
CONVERSION_START = "Using framework PyTorch"
MODEL_SAVED = "All good, model saved"
TOLERANCE_CHECK_FAILED = "Outputs values doesn't match between reference model and ONNX exported model"
VALIDATING_ONNX_MODEL = "Validating ONNX model"
NOT_ALL_WEIGHTS_USED = "Some weights of the model checkpoint"


class HuggingfaceModelDownloaderTool(PythonModuleTool):
    def __init__(self, python_exec: Path, model_id: str, onnx_model_path: Path):
        super().__init__(python_exec=python_exec, parameters=[
            dict(name='model', value=model_id, parameter_type=ConsoleParametersTypes.path),
            dict(
                name='feature',
                value='sequence-classification',
                parameter_type=ConsoleParametersTypes.constant,
                values=['sequence-classification']
            ),
            dict(value=str(onnx_model_path), parameter_type=ConsoleParametersTypes.path),
        ])

        self.exe = 'transformers.onnx'
        self.parameter_prefix = '--'


class HuggingfaceModelDownloaderParser(ConsoleToolOutputParser):
    def __init__(self, job_state_subject: JobStateSubject):
        super().__init__(job_state_subject=job_state_subject)
        self.current_pct = 0
        self.current_step = 0

        self.download_steps = 5
        self.pct_per_step = round(60 / self.download_steps)

        self.current = re.compile(r"(\d+\.?\d*)[Mk]?/\d+\.?\d*")
        self.total = re.compile(r"\d+\.?\d*[Mk]?/(\d+\.?\d*)")

        self.warning = None

        self.downloaded = False
        self.converted = False

    @skip_empty_line_decorator
    def parse(self, string: str):
        string = string.strip()

        if not self.downloaded:
            if string.startswith(DOWNLOAD_PROGRESS_STRING_START):
                self.parse_download_stage(string)
            elif string.startswith(CONVERSION_START):
                self.current_pct = 60
                self.downloaded = True
                self.parse_convert_stage(string)
            if not self.downloaded:
                print(self.current_pct)
        elif not self.converted:
            self.parse_convert_stage(string)
        else:
            self.parse_validation_stage(string)
            self.current_pct = 80

        self._job_state_subject.update_state(progress=self.current_pct)

    def parse_download_stage(self, string: str):
        current_size = float(self.current.search(string).group(1))
        total_size = float(self.total.search(string).group(1))

        ratio = 0 if current_size > total_size else current_size / total_size

        self.current_pct = (
            self.current_step * self.pct_per_step
            + round(ratio * self.pct_per_step)
        )

        self.current_step += (current_size == total_size)

    def parse_convert_stage(self, string: str) -> None:
        if NOT_ALL_WEIGHTS_USED in string:
            self.warning = string
            raise HuggingFaceONNXConvertorError(self.warning, self._job_state_subject.job_id)
        if VALIDATING_ONNX_MODEL in string:
            self.converted = True
            self.parse_validation_stage(string)

    def parse_validation_stage(self, string: str) -> None:
        if TOLERANCE_CHECK_FAILED in string:
            self.warning = string
            raise HuggingFaceONNXConvertorError(self.warning, self._job_state_subject.job_id)
        if MODEL_SAVED in string:
            self.current_pct = 100
