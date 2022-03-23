"""
 OpenVINO DL Workbench
 Tool to reshape model to a new shape

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
import argparse
import json
from pathlib import Path
from typing import Dict, List
from defusedxml import ElementTree

from openvino.runtime import Core, PartialShape, Model
from openvino.runtime.passes import Manager


def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', required=True, type=Path)
    return parser.parse_args()


def load_config(config_path: Path) -> dict:
    with config_path.open() as config_file:
        return json.load(config_file)


def construct_shape_configuration(inputs_configuration: List[Dict]) -> Dict[str, PartialShape]:
    return {
        input_configuration['index']: PartialShape(input_configuration['shape'])
        for input_configuration in inputs_configuration
    }


def reshape_model(xml_path: Path, bin_path: Path, shape_configuration: Dict[str, List[int]]) -> Model:
    core = Core()

    model: Model = core.read_model(
        model=str(xml_path),
        weights=str(bin_path),
    )

    node_output_per_shape = {}
    for input_index, input_configuration in shape_configuration.items():
        node = model.inputs[input_index].node
        node_output_per_shape[node.output(0)] = input_configuration

    model.reshape(node_output_per_shape)

    return model


def save_model_as_ir(model: Model, network_file_name: str, output_dir: Path):
    result_path = output_dir / network_file_name
    output_dir.mkdir(exist_ok=True)
    xml_path = f'{result_path}.xml'.encode('UTF-8')
    bin_path = f'{result_path}.bin'.encode('UTF-8')

    pass_manager = Manager()
    pass_manager.register_pass('Serialize', xml_path, bin_path)
    pass_manager.run_passes(model)


# TODO: Looks like the class to report progress can be reused in another tools, we need to generalize it and make shared
class _ProgressReporter:
    def __init__(self, log_header: str, total_steps: int, progress_step: int = 1):
        self._log_header = log_header
        self._prev_progress = 0
        self._total_steps = total_steps
        self._current_step = 0
        self._progress_step = progress_step

    def _log_progress(self):
        print(f'{self._log_header}: {self.prev_progress}%')

    def next_step(self):
        self._current_step += 1
        progress = int(self._current_step * (100 / self._total_steps))
        if progress - self._prev_progress >= self._progress_step:
            self.prev_progress = progress
            self._log_progress()


def main(config: dict):
    progress_reporter = _ProgressReporter(log_header='[RESHAPE TOOL]',
                                          total_steps=4)
    progress_reporter.next_step()

    xml_path = Path(config['xml_path'])
    bin_path = Path(config['bin_path'])
    dump_reshaped_model = config['dump_reshaped_model']

    inputs_shape_configuration = config['inputs_shape_configuration']

    shape_configuration = construct_shape_configuration(inputs_shape_configuration)

    progress_reporter.next_step()

    reshaped_function = reshape_model(xml_path, bin_path, shape_configuration)
    progress_reporter.next_step()

    if dump_reshaped_model:
        output_dir = Path(config['output_dir'])

        old_model_content = ElementTree.parse(xml_path)
        metadata = old_model_content.find('./meta_data')

        save_model_as_ir(reshaped_function, xml_path.stem, output_dir)

        if metadata:
            new_model_content = ElementTree.parse(output_dir / xml_path.name)
            new_model_content.getroot().append(metadata)
            new_model_content.write(output_dir / xml_path.name)

    progress_reporter.next_step()


if __name__ == '__main__':
    ARGUMENTS = parse_arguments()
    CONFIGURATION = load_config(ARGUMENTS.config)
    try:
        main(CONFIGURATION)
    except RuntimeError as e:
        print(f'\n During the model reshape process, OpenVINO runtime error occurred:\n {str(e)}')
        exit(1)
