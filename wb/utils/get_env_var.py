"""
 OpenVINO DL Workbench
 Function for getting and safe parsing of environment variables

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
