import os
import re
import shlex
import sys
from subprocess import Popen, PIPE, STDOUT
from typing import Tuple, Optional


class BenchmarkToolRunner:
    _default_device = 'CPU'
    _default_inference_time = 20

    _throughput_pattern = re.compile(r'Throughput: (\d+.?\d+) FPS')

    def __init__(self, batch: int, streams: int, model_xml_path: str, dataset_path: str, device: str = _default_device,
                 inference_time: int = _default_inference_time):
        self._batch = batch
        self._streams = streams
        self._model_xml_path = model_xml_path
        self._dataset_path = dataset_path
        self._device = device
        self._inference_time = inference_time

    @property
    def _command(self) -> str:
        return f'''benchmark_app \
                -m "{self._model_xml_path}" \
                -i "{self._dataset_path}" \
                -d "{self._device}" \
                -b "{self._batch}" \
                -nstreams "{self._streams}" \
                -t "{self._inference_time}"
            '''

    def _run_subprocess(self) -> Tuple[int, str]:
        command = self._command
        print(f'[RUN COMMAND] {command}')
        process = Popen(shlex.split(command), stdout=PIPE, stderr=STDOUT)
        stdout, stderr = process.communicate()
        _output = stdout.decode()
        return process.returncode, _output

    def _parse_throughput(self, output: str) -> Optional[float]:
        # Example output: Throughput: 461.00 FPS
        throughput_match = self._throughput_pattern.search(output)
        if throughput_match:
            throughput = float(throughput_match.group(1))
            return throughput
        return None

    def get_result(self) -> float:
        return_code, output = self._run_subprocess()
        if return_code:
            print('Error during running benchmark tool')
            print(f'[Output] {output}')
            sys.exit(1)
        throughput = self._parse_throughput(output)
        if not throughput:
            print('Error during parsing throughput from benchmark tool output')
            sys.exit(1)
        return throughput
