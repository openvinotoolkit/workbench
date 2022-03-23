"""
 OpenVINO DL Workbench
 Progress tracker for accuracy checker tool

 Copyright (c) 2019 Intel Corporation

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
import math
from pathlib import Path
from typing import List

try:
    from wb.main.scripts.accuracy_tool.tool_output import AccuracyResult, AcCLIOutput
except ImportError:
    from tool_output import AccuracyResult, AcCLIOutput

try:
    from openvino.tools.accuracy_checker.accuracy_checker.progress_reporters import ProgressReporter
except ImportError:
    from openvino.tools.accuracy_checker.progress_reporters import ProgressReporter


class AccuracyProgressTracker(ProgressReporter):
    __provider__ = 'wb_accuracy_reporter'

    update_callback = None
    progress = 0
    batch_size = 1
    prefix = '[ACCURACY CHECKER]'

    def __init__(self, dataset_size=None):
        super().__init__(dataset_size)
        self.update_step = 0
        self.batches_total = 0
        self.result_path = None

    # pylint: disable=unused-argument
    def update(self, _batch_id=None, batch_size=None):
        current_batch = _batch_id + 1
        if current_batch % 5 == 0:
            self.update_progress(self.update_step * 5)
        elif current_batch == self.batches_total:
            n_last_batches = current_batch % 5
            self.update_progress(self.update_step * n_last_batches)

    @staticmethod
    def update_progress(progress: float):
        AccuracyProgressTracker.progress += progress
        output = AcCLIOutput(progress=int(AccuracyProgressTracker.progress), done=False)
        print(f'{AccuracyProgressTracker.prefix}:{output.serialize()}')

    def reset(self, dataset_size=None):
        super().reset(dataset_size)
        self.batches_total = int(math.ceil(dataset_size * 1. / AccuracyProgressTracker.batch_size))
        self.update_step = 100 / self.batches_total

    def set_result_path(self, result_path: str):
        self.result_path = Path(result_path)

    def on_success(self, accuracy_results: List[AccuracyResult]):
        output = AcCLIOutput(progress=100, done=True, accuracy_results=accuracy_results)
        if self.result_path:
            self._dump_result_to_file(output, self.result_path)
        print(f'{self.prefix}:{output.serialize()}')

    @staticmethod
    def _dump_result_to_file(output: AcCLIOutput, output_path: Path):
        output_path.mkdir(exist_ok=True)
        result_file_path = output_path / 'accuracy_result.json'
        with result_file_path.open('w') as result_file:
            json.dump(output.to_dict(), result_file)
