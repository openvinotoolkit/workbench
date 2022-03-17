"""
 OpenVINO DL Workbench
 Check accuracy cli interfaces

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
