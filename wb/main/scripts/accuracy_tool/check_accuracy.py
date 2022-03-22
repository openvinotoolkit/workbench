"""
 OpenVINO DL Workbench
 Accuracy cli tool

 Copyright (c) 2018 Intel Corporation

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
# !/usr/bin/env python
import argparse
from pathlib import Path
from typing import List, Tuple, Optional

import numpy as np
import yaml


try:
    from wb.main.scripts.accuracy_tool.tool_output import AccuracyResult
    from wb.main.scripts.accuracy_tool.accuracy_progress_tracker import AccuracyProgressTracker
except ImportError:
    from accuracy_progress_tracker import AccuracyProgressTracker
    from tool_output import AccuracyResult

try:
    from openvino.tools.accuracy_checker.accuracy_checker.evaluators import ModelEvaluator
    from openvino.tools.accuracy_checker.accuracy_checker.presenters import get_result_format_parameters
    from openvino.tools.accuracy_checker.accuracy_checker.progress_reporters import ProgressReporter
except ImportError:
    from openvino.tools.accuracy_checker.evaluators import ModelEvaluator
    from openvino.tools.accuracy_checker.presenters import get_result_format_parameters, EvaluationResult
    from openvino.tools.accuracy_checker.progress_reporters import ProgressReporter

PARSER = argparse.ArgumentParser()

PARSER.add_argument('--yml-config',
                    help='Yaml configuration as a string',
                    type=str,
                    required=True)

PARSER.add_argument('--log-dir',
                    help='Output directory for metric reports',
                    type=str,
                    required=True)

PARSER.add_argument('--profile',
                    help='Generate metric profiling report',
                    action='store_true',
                    default=False)


def get_accuracy(evaluation_result: EvaluationResult) -> Tuple[float, Optional[str]]:
    value = evaluation_result.evaluated_value
    meta = evaluation_result.meta
    accuracy = 0
    postfix, scale, _ = get_result_format_parameters(meta, False)
    postfix = postfix.strip()
    if np.isscalar(value):
        accuracy = value
    # In case of vectorized metric with one number 'value'l could be array with zero shape
    elif meta.get('calculate_mean', True) or (isinstance(value, np.ndarray) and not np.shape(value)):
        accuracy = np.mean(value)
    elif np.shape(value):
        accuracy = value[0]
    return round(accuracy * scale, 2), postfix or None


def get_accuracy_results(metric_results: List[EvaluationResult]) -> List[AccuracyResult]:
    accuracy_results: List[AccuracyResult] = []

    for result in metric_results:
        accuracy, postfix = get_accuracy(result)
        result = AccuracyResult(
            metric=result.metric_type,
            metric_name=result.name,
            result=accuracy,
            postfix=postfix,
            report_file=result.profiling_file,
        )
        accuracy_results.append(result)
    return accuracy_results


# todo: 1. yolo model generates tons of boxes, consider adding of a threshold (0.1)
# todo: 2. use camelCase for report entities json

def main():
    args = PARSER.parse_args()
    with Path(args.yml_config).open() as config_file:
        config = yaml.safe_load(config_file)

    model_evaluator = ModelEvaluator.from_configs(config['models'][0])

    AccuracyProgressTracker.batch_size = model_evaluator.launcher.batch

    progress_reporter = ProgressReporter.provide((
        'wb_accuracy_reporter'
    ))
    progress_reporter.reset(model_evaluator.dataset.size)
    progress_reporter.set_result_path(args.log_dir)

    try:
        model_evaluator.process_dataset(
            None,
            progress_reporter=progress_reporter,
            profiler_log_dir=args.log_dir,
            profile_report_type='json',
            profile=args.profile,
        )

        metric_results: List[EvaluationResult] = model_evaluator.compute_metrics(
            print_results=False,
            ignore_results_formatting=False,
        )
    finally:
        model_evaluator.release()

    progress_reporter.on_success(accuracy_results=get_accuracy_results(metric_results))


if __name__ == '__main__':
    main()
