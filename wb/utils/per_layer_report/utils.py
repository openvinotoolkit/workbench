"""
 OpenVINO DL Workbench
 Common functions and variables used in runtime representation processing

 Copyright (c) 2018 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
