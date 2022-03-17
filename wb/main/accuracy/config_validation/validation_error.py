"""
 OpenVINO DL Workbench
 Accuracy config validation error classes

 Copyright (c) 2021 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""

from typing import Tuple, Optional


class Mark:
    line: int
    column: int

    def __init__(self, line: int, column: int):
        self.line = line
        self.column = column

    def to_dict(self) -> dict:
        return {
            'line': self.line,
            'column': self.column,
        }


class RangeMark:
    start: Mark
    end: Mark

    def __init__(self, start: Mark, end: Mark):
        self.start = start
        self.end = end

    def to_dict(self) -> dict:
        return {
            'start': self.start.to_dict(),
            'end': self.end.to_dict(),
        }


class ACValidationError:
    message: str
    mark: Optional[RangeMark]
    entry: Optional[str]
    path: Optional[str]

    def __init__(self, message: str, mark: RangeMark = None, entry: str = None, path: str = None):
        self.message = message
        self.mark = mark
        self.entry = entry
        self.path = path

    def to_dict(self) -> dict:
        return {
            'entry': self.entry,
            'path': self.path,
            'message': self.message,
            'mark': self.mark.to_dict() if self.mark else None,
        }


class ACValidationResult:
    valid: bool
    errors: Tuple[ACValidationError]

    def __init__(self, valid: bool, errors: Tuple[ACValidationError] = None):
        self.valid = valid
        self.errors = errors

    def to_dict(self) -> dict:
        return {
            'valid': self.valid,
            'errors': tuple(error.to_dict() for error in self.errors) if self.errors else None,
        }
