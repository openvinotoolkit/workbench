"""
 OpenVINO DL Workbench
 Function for getting and safe parsing of environment variables

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
from pathlib import Path
from typing import Union, Callable

from wb.error.parse_env_error import ParseEnvError


EnvVarType = Union[Path, str, int, bool, None]


def get_env_var(name: str, default: EnvVarType = None,
                cast_function: Callable[[EnvVarType], EnvVarType] = str) -> EnvVarType:
    try:
        env_var = os.getenv(name, default)
        return cast_function(env_var) if env_var else env_var
    except ValueError:
        raise ParseEnvError(env_var_name=name)
