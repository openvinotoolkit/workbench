"""
 OpenVINO DL Workbench
 Accuracy config validation error classes

 Copyright (c) 2021 Intel Corporation

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
