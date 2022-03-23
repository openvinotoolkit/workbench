"""
 OpenVINO DL Workbench
 Script to getting system resources: CPU, RAM, DISK

 Copyright (c) 2020 Intel Corporation

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
import os

import psutil


def bytes_to_gb(num_bytes: int) -> float:
    factor = 2 ** (3 * 10)
    return num_bytes / factor


def get_cpu_usage(per_cpu: bool = False, number_of_measurements=5) -> list:
    result = []
    if per_cpu:
        result = [0 for _ in psutil.cpu_percent(percpu=True)]
        for _ in range(number_of_measurements):
            for i, percentage in enumerate(psutil.cpu_percent(interval=1, percpu=True)):
                result[i] += percentage / number_of_measurements
    else:
        result.append(psutil.cpu_percent(interval=1, percpu=False))
    return result


def get_ram_usage() -> dict:
    # Get the memory details
    svmem = psutil.virtual_memory()
    # get the swap memory details (if exists)
    swap = psutil.swap_memory()

    return {
        'TOTAL': bytes_to_gb(svmem.total),
        'USED': bytes_to_gb(svmem.used),
        'AVAILABLE': bytes_to_gb(svmem.available),
        'PERCENTAGE': svmem.percent,
        'SWAP': {
            'TOTAL': bytes_to_gb(swap.total),
            'USED': bytes_to_gb(swap.used),
            'AVAILABLE': bytes_to_gb(swap.free),
            'PERCENTAGE': swap.percent,
        }
    }


def get_disk_usage() -> dict:
    result = {
        'TOTAL': 0,
        'USED': 0,
        'AVAILABLE': 0,
        'PERCENTAGE': 0,
    }
    partitions = psutil.disk_partitions()

    for partition in partitions:
        try:
            partition_usage = psutil.disk_usage(partition.mountpoint)
        except PermissionError:
            # This can be catched due to the disk that isn't ready
            continue
        result['TOTAL'] += bytes_to_gb(partition_usage.total)
        result['USED'] += bytes_to_gb(partition_usage.used)
        result['AVAILABLE'] += bytes_to_gb(partition_usage.free)

    result['PERCENTAGE'] = (result['USED'] * 100) / result['TOTAL']

    return result


def main(output: str):
    system_info = {
        'CPU': get_cpu_usage(per_cpu=True),
        'RAM': get_ram_usage(),
        'DISK': get_disk_usage(),
    }

    if not os.path.exists(os.path.dirname(output)):
        os.makedirs(os.path.dirname(output))
    with open(output, 'w') as file_d:
        json.dump(system_info, file_d)


if __name__ == '__main__':
    PARSER = argparse.ArgumentParser()
    PARSER.add_argument('-output', type=str,
                        help='File to save results')
    ARGUMENTS = PARSER.parse_args()

    main(ARGUMENTS.output)
