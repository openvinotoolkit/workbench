"""
 OpenVINO DL Workbench
 Check accuracy cli interfaces

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

import json
from typing import NamedTuple, Optional, List


class AccuracyResult(NamedTuple):
    metric: str
    metric_name: str
    result: float
    postfix: Optional[str]
    report_file: Optional[str]


class AcCLIOutput:
    def __init__(self, progress: float, done: bool, accuracy_results: Optional[List[AccuracyResult]] = None):
        self.progress = progress
        self.done = done
        self.accuracy_results = accuracy_results

    @staticmethod
    def from_string(json_string: str) -> 'AcCLIOutput':
        loaded = json.loads(json_string)
        return AcCLIOutput.from_dict(loaded)

    @staticmethod
    def from_dict(dict_data: dict) -> 'AcCLIOutput':
        accuracy_results = None
        if dict_data['accuracy_results']:
            accuracy_results = [
                AccuracyResult(
                    metric=report[0], metric_name=report[1],
                    result=report[2], postfix=report[3],
                    report_file=report[4]
                )
                for report in dict_data['accuracy_results']
            ]

        return AcCLIOutput(
            progress=dict_data['progress'],
            done=dict_data['done'],
            accuracy_results=accuracy_results
        )

    def to_dict(self) -> dict:
        return {
            'progress': self.progress,
            'done': self.done,
            'accuracy_results': self.accuracy_results
        }

    def serialize(self) -> str:
        return json.dumps(self.to_dict())
