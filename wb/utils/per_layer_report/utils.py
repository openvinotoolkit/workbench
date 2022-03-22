"""
 OpenVINO DL Workbench
 Common functions and variables used in runtime representation processing

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

SPATIAL_PARAMS_NAMES = {
    'dilations', 'dilation-x', 'dilation-y',  # -> dilation = [dilation-x, dilation-y, dilation-z]
    'pads-begin', 'pads', 'pads-end',
    'pad-x', 'pad-y', 'auto-pad',  # -> pad = [pad-x, pad-y, pad-z]
    'pad-b', 'pad-g', 'pad-r',
    'kernel', 'kernel-x', 'kernel-y',  # -> kernel = [kernel-x, kernel-y, kernel-z]
    'stride', 'strides', 'stride-x', 'stride-y',  # -> stride = [stride-x, stride-y, stride-z]
}


def cast_value(value: str):
    sequence = [v for v in value.split(',')]
    if len(sequence) > 1:
        return [cast_to_number(v) for v in sequence]
    return cast_to_number(value)


def cast_to_number(value: str):
    if value.isdigit():
        return int(value)
    try:
        return float(value)
    except ValueError:
        return value
