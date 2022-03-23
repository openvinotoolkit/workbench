"""
 OpenVINO DL Workbench
 Tool for getting devices from remote target

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

# pylint: disable=no-name-in-module
from openvino.runtime import Core


def main(output: str):
    ie_core = Core()

    available_devices = []

    # pylint: disable=not-an-iterable
    for device in ie_core.available_devices:
        info = device_info(ie_core, device)

        available_devices.append({
            'DEVICE': device,
            **info
        })

    if not os.path.exists(os.path.dirname(output)):
        os.makedirs(os.path.dirname(output))
    with open(output, 'w') as file_d:
        json.dump(available_devices, file_d)


def device_info(ie_core, device) -> dict:
    return {
        'DEVICE': device,
        **load_supported_metrics(ie_core, device),
        'DEFAULT_CONFIGURATION': load_default_configuration(ie_core, device) if device != 'MYRIAD' else []
    }


def load_supported_metrics(ie_core, device) -> dict:
    needed_keys = {
        'AVAILABLE_DEVICES',
        'FULL_DEVICE_NAME',
        'OPTIMIZATION_CAPABILITIES',
        'RANGE_FOR_ASYNC_INFER_REQUESTS',
        'RANGE_FOR_STREAMS'
    }
    supported_metrics = {}
    device_supported_metrics = set(ie_core.get_property(device, 'SUPPORTED_METRICS')).intersection(needed_keys)
    for metric in device_supported_metrics:
        try:
            metric_val = ie_core.get_property(device, metric)
            supported_metrics[metric] = perform_param(metric_val, 'RANGE' in metric)
        except AttributeError:
            continue
    return supported_metrics


def load_default_configuration(ie_core, device) -> dict:
    default_configuration = {}
    for cfg in ie_core.get_property(device, 'SUPPORTED_CONFIG_KEYS'):
        try:
            cfg_val = ie_core.get_config(device, cfg)
            default_configuration[cfg] = perform_param(cfg_val)
        except (AttributeError, TypeError):
            continue
    return default_configuration


def perform_param(metric, is_range=True):
    if isinstance(metric, (list, tuple)):
        res = []
        if is_range:
            metric_range = {
                'MIN': int(metric[0]) or 1,
                'MAX': int(metric[1]) if len(metric) >= 2 else 1,
                'STEP': int(metric[2]) if len(metric) >= 3 else 1
            }
            return metric_range
        for source_val in metric:
            try:
                val = int(source_val)
            except ValueError:
                val = str(source_val)
            res.append(val)
        return res
    if isinstance(metric, dict):
        str_param_repr = ''
        for key, value in metric.items():
            str_param_repr += f'{key}: {value}\n'
        return str_param_repr
    try:
        return int(metric)
    except ValueError:
        return str(metric)


if __name__ == '__main__':
    PARSER = argparse.ArgumentParser()
    PARSER.add_argument('-output', type=str,
                        help='File to save results')
    ARGUMENTS = PARSER.parse_args()

    main(ARGUMENTS.output)
