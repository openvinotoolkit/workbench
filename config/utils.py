"""
 OpenVINO DL Workbench
 Common functions used in all project

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

import os
import re
import sys
from pathlib import Path
from typing import List, Tuple, Optional, Dict

from wb.main.enumerates import OpenVINOWheelsEnum


def make_canonical_path(path: str) -> str:
    return os.path.realpath(os.path.expanduser(path))


def parse_host_port_from_url(url: str) -> Tuple[str, int]:
    host_pattern = r'(?P<host>(?:http.*:\/\/)?[^:\/ ]+)'
    port_pattern = r'(?P<port>[0-9]+)'
    pattern = f'{host_pattern}:{port_pattern}'
    match = re.search(pattern, url)
    if not match:
        raise AssertionError(f'Inconsistent URL address: {url}')
    host = match.group('host')
    port = int(match.group('port'))
    return host, port


CONFIG_NAME_PATTERN_TO_DOCS_URL_SUFFIX_MAP = {
    r'rcnn_support': '_tf_specific_Convert_Object_Detection_API_Models.html',
    r'ssd_support': '_tf_specific_Convert_Object_Detection_API_Models.html',
    r'rfcn_support': '_tf_specific_Convert_Object_Detection_API_Models.html',
    r'ssd_v': '_tf_specific_Convert_Object_Detection_API_Models.html',
    r'efficient': '_tf_specific_Convert_EfficientDet_Models.html',
    r'yolo_v\d(?!_mobilenet1)': '_tf_specific_Convert_YOLO_From_Tensorflow.html',
    r'mobilenet1': '_mxnet_specific_Convert_GluonCV_Models.html',
    r'faster_rcnn(?!.)': '_onnx_specific_Convert_Faster_RCNN.html',
    r'mask_rcnn(?!.)': '_onnx_specific_Convert_Mask_RCNN.html'
}

MODEL_CONVERT_URL_PREFIX = 'https://docs.openvinotoolkit.org/latest/openvino_docs_MO_DG_prepare_model_convert_model'


def get_config_docs_url(name: str) -> Optional[str]:
    result = None
    for pattern in CONFIG_NAME_PATTERN_TO_DOCS_URL_SUFFIX_MAP:
        if re.search(pattern, name):
            result = f'{MODEL_CONVERT_URL_PREFIX}{CONFIG_NAME_PATTERN_TO_DOCS_URL_SUFFIX_MAP[pattern]}'
    return result


def get_mo_framework_dirs(path) -> List[Path]:
    configs_dir = Path(path) / 'front'
    return [configs_dir / item for item in configs_dir.iterdir() if (configs_dir / item).is_dir()]


def find_predefined_transformations_configs(path: str) -> List[dict]:
    configs = []
    for framework_dir in get_mo_framework_dirs(path):
        framework_configs = framework_dir.rglob('*.json')
        configs.extend({'name': item.stem,
                        'path': str(item),
                        'framework': framework_dir.stem,
                        'documentation': get_config_docs_url(item.stem)}
                       for item in framework_configs)
    return configs


def find_openvino_wheels_by_python_version(path_to_wheels: str) -> Dict[OpenVINOWheelsEnum, str]:
    wheels = {}
    major = sys.version_info.major
    minor = sys.version_info.minor

    # Example: openvino-2022.1.0.dev20211222-5876-cp36-cp36m-manylinux_2_27_x86_64.whl
    runtime_wheel_regexp = re.compile(rf'openvino-202\d\.\d+\.\d+.+-cp{major}{minor}.+\.whl')
    try:
        wheels[OpenVINOWheelsEnum.ov_runtime_wheel] = next(
            f for f in os.listdir(path_to_wheels) if re.search(runtime_wheel_regexp, f)
        )
    except StopIteration as exc:
        raise StopIteration('No runtime wheel was found.') from exc

    # Example: openvino_dev-2022.1.0-5583-py3-none-any.whl
    dev_wheel_regexp = re.compile(r'openvino_dev-202\d\.\d+\.\d+.+\.whl')
    try:
        wheels[OpenVINOWheelsEnum.ov_dev_wheel] = next(
            f for f in os.listdir(path_to_wheels) if re.search(dev_wheel_regexp, f)
        )
    except StopIteration as exc:
        raise StopIteration('No openvino-dev was found.') from exc

    return wheels


def find_runtime_openvino_wheels(path_to_wheels: str) -> List[str]:
    runtime_wheel_regexp = re.compile(r'openvino-202\d\.\d+\.\d+.+-cp\d+.+\.whl')
    return [f for f in os.listdir(path_to_wheels) if re.search(runtime_wheel_regexp, f)]
