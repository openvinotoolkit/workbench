"""
 OpenVINO DL Workbench
 Entrypoint of dataset annotator tool

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
from pathlib import Path

import yaml

from openvino.tools.accuracy_checker.evaluators import ModelEvaluator

from dataset_annotator import DatasetAnnotator
try:
    from wb.main.shared.enumerates import TaskEnum
except ImportError:
    from shared.enumerates import TaskEnum


def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('--accuracy-config', required=True, type=Path,
                        help='Path to yaml configuration')
    parser.add_argument('--model-type', required=True,
                        help='Type of the model',
                        type=TaskEnum)
    parser.add_argument('--images-dir', required=True, type=Path,
                        help='Path to images to annotate')
    parser.add_argument('--output-dir', required=True,
                        help='Directory for results', type=Path)
    parsed_args = parser.parse_args()

    return parsed_args


def load_accuracy_config(accuracy_config_path: Path) -> dict:
    with accuracy_config_path.open() as accuracy_config_file:
        return yaml.safe_load(accuracy_config_file)


if __name__ == '__main__':
    arguments = parse_arguments()

    accuracy_config = load_accuracy_config(arguments.accuracy_config)
    model_config = accuracy_config['models'][0]
    model_evaluator = ModelEvaluator.from_configs(accuracy_config['models'][0],
                                                  delayed_annotation_loading=True)

    try:
        dataset_annotator = DatasetAnnotator(images_path=arguments.images_dir,
                                             task_type=TaskEnum(arguments.model_type),
                                             model_evaluator=model_evaluator)
        dataset_annotator.create_annotated_dataset(output_path=arguments.output_dir)
    except Exception as exception:
        raise exception
    finally:
        model_evaluator.release()
