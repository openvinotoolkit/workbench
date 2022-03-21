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

from wb.error.job_error import TransformersONNXConversionError
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

        self.downloaded = False
        self.downloaded_pct = 60
        self.converted = False
        self.converted_pct = 80

        self.error = False

    @skip_empty_line_decorator
    def parse(self, string: str):
        if self.error:
            return

        string = string.strip()

        # skip tensorflow error message
        if "error" in string.lower() and "tensorflow" not in string.lower():
            self.error = True
            self._job_state_subject.update_state(progress=100)
            return

        if not self.downloaded:
            if string.startswith(DOWNLOAD_PROGRESS_STRING_START):
                self.parse_download_stage(string)
            elif string.startswith(CONVERSION_START):
                self.current_pct = self.downloaded_pct
                self.downloaded = True
                self.parse_convert_stage(string)
        elif not self.converted:
            self.parse_convert_stage(string)
        else:
            self.parse_validation_stage(string)

        self._job_state_subject.update_state(progress=self.current_pct)

    def parse_download_stage(self, string: str):
        current_size_match = self.current.search(string)
        total_size_match = self.total.search(string)

        if not current_size_match or not total_size_match:
            return

        current_size = float(current_size_match.group(1))
        total_size = float(total_size_match.group(1))

        ratio = 0 if current_size > total_size else current_size / total_size

        self.current_pct = max(
            self.current_step * self.pct_per_step + round(ratio * self.pct_per_step),
            self.current_pct
        )

        self.current_step += (current_size == total_size)

    def parse_convert_stage(self, string: str) -> None:
        self.current_pct = min(self.current_pct + 1, 100)

        if NOT_ALL_WEIGHTS_USED in string:
            self.error = True
        elif VALIDATING_ONNX_MODEL in string:
            self.converted = True
            self.current_pct = self.converted_pct
            self.parse_validation_stage(string)

    def parse_validation_stage(self, string: str) -> None:
        self.current_pct = min(self.current_pct + 4, 100)

        if TOLERANCE_CHECK_FAILED in string:
            self.error = True
        elif MODEL_SAVED in string:
            self.current_pct = 100
