"""
 OpenVINO DL Workbench
 Tool to calculate INT8 model tensor distance comparing with original model

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

import argparse
import json
import os
from pathlib import Path
from typing import Dict

import cv2
import numpy as np

from openvino.inference_engine import IECore

try:
    from wb.main.shared.utils import find_all_paths_by_exts
    from wb.main.shared.constants import ALLOWED_EXTENSIONS_IMG, TENSOR_DISTANCE_REPORT_FILE_NAME
except ImportError:
    from shared.utils import find_all_paths_by_exts
    from shared.constants import ALLOWED_EXTENSIONS_IMG, TENSOR_DISTANCE_REPORT_FILE_NAME


PARSER = argparse.ArgumentParser()

PARSER.add_argument('--original-model-xml-path',
                    help='Path to original model xml file',
                    type=Path,
                    required=True)

PARSER.add_argument('--original-model-bin-path',
                    help='Path to original model bin file',
                    type=Path,
                    required=True)

PARSER.add_argument('--optimized-model-xml-path',
                    help='Path to optimized model xml file',
                    type=Path,
                    required=True)

PARSER.add_argument('--optimized-model-bin-path',
                    help='Path to optimized model bin file',
                    type=Path,
                    required=True)

PARSER.add_argument('--dataset-path',
                    help='Path to dataset directory',
                    type=Path,
                    required=True)

PARSER.add_argument('--output-report-path',
                    help='Output report path',
                    type=Path,
                    required=True)


class OpenVINOModelLauncher:
    def __init__(self, model_xml_path: Path, model_bin_path: Path):
        self.ie_core = IECore()
        self.network = self.ie_core.read_network(model=str(model_xml_path), weights=str(model_bin_path))
        self.loaded_network = self.ie_core.load_network(self.network, 'CPU')
        self.input_blob = next(iter(self.network.input_info))
        self.output_blob_names = list(self.network.outputs.keys())

    def infer(self, frame: np.ndarray) -> Dict[str, np.ndarray]:
        in_frame = self._pre_process_frame(frame)
        return self.loaded_network.infer(inputs={self.input_blob: in_frame})

    def _pre_process_frame(self, frame: np.ndarray):
        batch, channels, height, width = self.network.input_info[self.input_blob].input_data.shape
        frame = cv2.resize(frame, (width, height))
        frame = frame.transpose((2, 0, 1))
        return frame.reshape((batch, channels, height, width))


class _ProgressReporter:
    def __init__(self, total_steps: int, progress_step: int = 1):
        self.prev_progress = 0
        self.total_steps = total_steps
        self.current_step = 0
        self.progress_step = progress_step

    def _log_progress(self):
        print(f'[TENSOR DISTANCE] {self.prev_progress}%')

    def next_step(self):
        self.current_step += 1
        progress = int(self.current_step * (100 / self.total_steps))
        if progress - self.prev_progress >= self.progress_step:
            self.prev_progress = progress
            self._log_progress()


def main():
    args = PARSER.parse_args()

    original_model_xml_path = Path(args.original_model_xml_path)
    original_model_bin_path = Path(args.original_model_bin_path)
    optimized_model_xml_path = Path(args.optimized_model_xml_path)
    optimized_model_bin_path = Path(args.optimized_model_bin_path)
    dataset_path = Path(args.dataset_path)
    output_report_path = Path(args.output_report_path) if args.output_report_path else None

    report_filename = Path(TENSOR_DISTANCE_REPORT_FILE_NAME)
    report_path = output_report_path / report_filename if output_report_path else report_filename

    original_model_launcher = OpenVINOModelLauncher(model_xml_path=original_model_xml_path,
                                                    model_bin_path=original_model_bin_path)

    int8_model_launcher = OpenVINOModelLauncher(model_xml_path=optimized_model_xml_path,
                                                model_bin_path=optimized_model_bin_path)


    image_paths = list(find_all_paths_by_exts(dir_path=dataset_path, extensions=ALLOWED_EXTENSIONS_IMG, recursive=True,
                                              result_type=str))

    progress_reporter = _ProgressReporter(len(image_paths), 5)
    entities = []
    for index, image_path in enumerate(image_paths):
        image = cv2.imread(image_path)
        original_model_infer_result = original_model_launcher.infer(image)
        int8_model_infer_result = int8_model_launcher.infer(image)
        for output_name in original_model_launcher.output_blob_names:
            original_model_buffer = original_model_infer_result[output_name]
            int8_model_buffer = int8_model_infer_result[output_name]
            mse = float((np.square(original_model_buffer - int8_model_buffer)).mean())
            image_name = os.path.basename(image_path)
            output_name = output_name
            entities.append({'image_name': image_name, 'output_name': output_name, 'mse': mse})
            progress_reporter.next_step()

    report_path.touch(exist_ok=True)

    result = {
        'output_names': original_model_launcher.output_blob_names,
        'entities': entities
    }

    with report_path.open('w') as report_file:
        json.dump(result, report_file, sort_keys=False, indent=2)


if __name__ == '__main__':
    main()
