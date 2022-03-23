"""
 OpenVINO DL Workbench
 Yaml syntax validator

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
from typing import Optional

import yaml

from wb.main.accuracy.config_validation.validation_error import ACValidationError, RangeMark, Mark


def validate(config: str) -> Optional[ACValidationError]:
    try:
        yaml.safe_load(config)
    except yaml.MarkedYAMLError as error:
        if error.problem_mark:
            range_mark: RangeMark = RangeMark(
                Mark(error.problem_mark.line + 1, 1),
                Mark(error.problem_mark.line + 1, error.problem_mark.column + 1),
            )
            return ACValidationError(error.problem, range_mark)

        if error.context_mark:
            range_mark: RangeMark = RangeMark(
                Mark(error.context_mark.line + 1, 1),
                Mark(error.context_mark.line + 1, error.context_mark.column + 1),
            )
            return ACValidationError(error.context, range_mark)

        return ACValidationError('Not valid yaml file')
    except yaml.YAMLError as error:
        return ACValidationError(str(error))

    return None
