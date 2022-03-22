"""
 OpenVINO DL Workbench
 Script-wrapper for running benchmark application on local and remote targets

 Copyright (c) 2020 Intel Corporation

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
import re
import shlex
import sys
from pathlib import Path
from subprocess import Popen, PIPE, STDOUT  # nosec: blacklist
from typing import Optional, List

try:
    from typing import TypedDict
except ImportError:
    from typing_extensions import TypedDict

try:
    from wb.utils.benchmark_report.benchmark_report import BenchmarkReport
except ImportError:
    # pylint: disable=import-error
    from benchmark_report import BenchmarkReport


class ProfilingConfigurationFile(TypedDict):
    modelPath: str
    inputPath: str
    device: str
    time: int
    parallelizeType: str
    inferenceConfigurations: List[TypedDict('InferenceConfigurations', {'batch': int, 'numStreams': int})]


class BenchmarkToolParameters(TypedDict):
    benchmark_app_executable: str
    model_path: str
    input_path: Optional[str]
    device: str
    time: int
    batch: int
    num_streams: int
    parallelize_type: str
    artifact_path: str
    exec_graph_path: Optional[str]


def parse_args():
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument('-profiling-bundle-path', type=Path, required=True)
    parser.add_argument('-artifact-path', type=Path, required=True)
    parser.add_argument('-config', type=Path, required=True)

    return parser.parse_args()


def log_results(log_string: str, result_tag: str):
    print(f'[RESULTS] {result_tag} {log_string}')


def print_execution_graph(execution_graph_path: Path):
    with execution_graph_path.open() as xml_file:
        exec_graph = xml_file.read()
    exec_graph = exec_graph.replace('\n', '')
    log_results(exec_graph, result_tag='[EXECUTION GRAPH]')


def print_execution_results(report: BenchmarkReport):
    log_results(f'{report.batch};{report.streams}', result_tag='[BATCH;STREAMS]')
    log_results(str(report.latency), result_tag='[LATENCY]')
    log_results(str(report.throughput), result_tag='[THROUGHPUT]')
    log_results(str(report.total_exec_time), result_tag='[TOTAL EXECUTION TIME]')


def run_command(command: str) -> int:
    print(f'[RUN COMMAND] {command}')
    process = Popen(shlex.split(command), stdout=PIPE, stderr=STDOUT)  # nosec
    while True:
        output = process.stdout.readline().decode()
        if not output and process.poll() is not None:
            break
        if output and not output.isspace():
            output = output.strip()
            print(output)
    return process.poll()


def run_benchmark_tool(parameters: BenchmarkToolParameters) -> int:
    benchmark_app_executable = parameters['benchmark_app_executable']
    model_path = parameters['model_path']
    input_path = parameters['input_path']
    device = parameters['device']
    time = parameters['time']
    parallelize_type = parameters['parallelize_type']
    artifact_path = parameters['artifact_path']
    batch = parameters['batch']
    num_streams = parameters['num_streams']
    exec_graph_path = parameters.get('exec_graph_path')

    pc_params = f'-pc --exec_graph_path "{exec_graph_path}"' if exec_graph_path else ''
    report_type = 'no_counters'

    arguments = ' '.join([f'-m "{model_path}"',
                          f'-i "{input_path}"' if input_path else '',
                          f'-d "{device}"',
                          f'-b "{batch}"' if batch else '',
                          f'-{parallelize_type} "{num_streams}"' if num_streams else '',
                          f'-t "{time}"',
                          f'--report_type "{report_type}"',
                          f'--report_folder "{artifact_path}"',
                          f'{pc_params}'])
    command = f'"{benchmark_app_executable}" {arguments}'
    return run_command(command)


def main(args) -> int:
    benchmark_app_executable = 'benchmark_app'
    with args.config.open() as config_file:
        config: ProfilingConfigurationFile = json.load(config_file)

    model_path = args.profiling_bundle_path / config['modelPath']

    # Process input path
    input_path = config.get('inputPath')
    if input_path and ':' in input_path:
        # Examples:
        #   /dir_1/
        #   input_1:/dir_1/file_1.bin,/dir_3/file_3.bin,input_2:/dir_2/file_2.bin
        inputs_name_re = r"([^,]\w+):"
        split_input_data = filter(None, re.split(inputs_name_re, input_path))

        # construct dict from pairs from list [1, 2, 3, 4, ...] -> {1: 2, 3: 4, ...}
        split_input_data_iter = iter(split_input_data)
        input_data_dict = dict(zip(split_input_data_iter, split_input_data_iter))

        inputs_with_paths = []
        for input_name, input_file_paths in input_data_dict.items():
            paths = input_file_paths.strip(",").split(",")
            new_paths = ','.join(str(args.profiling_bundle_path / path) for path in paths)
            inputs_with_paths.append(f'{input_name}:{new_paths}')

        input_path = ','.join(inputs_with_paths)
    elif input_path:
        input_path = args.profiling_bundle_path / input_path

    device = config['device']
    time = config['time']
    parallelize_type = config['parallelizeType']

    for single_inference_config in config['inferenceConfigurations']:
        batch = single_inference_config['batch']
        num_streams = single_inference_config['numStreams']
        print(f'[NEW STAGE] {batch};{num_streams}')

        sub_dir = f'{batch}_{num_streams}'
        artifact_path = args.artifact_path / sub_dir
        artifact_path.mkdir(exist_ok=True)
        exec_graph_path = artifact_path / 'exec_graph.xml'

        benchmark_tool_parameters = BenchmarkToolParameters(
            benchmark_app_executable=benchmark_app_executable,
            model_path=model_path,
            input_path=input_path,
            device=device,
            time=time,
            parallelize_type=parallelize_type,
            batch=batch,
            num_streams=num_streams,
            artifact_path=artifact_path,
            exec_graph_path=exec_graph_path
        )

        benchmark_exec_code = run_benchmark_tool(parameters=benchmark_tool_parameters)

        if benchmark_exec_code:
            return benchmark_exec_code

        benchmark_tool_parameters['exec_graph_path'] = None

        benchmark_exec_code = run_benchmark_tool(parameters=benchmark_tool_parameters)

        if benchmark_exec_code:
            return benchmark_exec_code

        report_file_name = 'benchmark_report.csv'
        benchmark_report = BenchmarkReport(artifact_path / report_file_name)

        print_execution_graph(exec_graph_path)
        print_execution_results(benchmark_report)

        print('[STAGE SUCCESS]')

    return 0


if __name__ == '__main__':
    sys.exit(main(parse_args()))
