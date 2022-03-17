"""
 OpenVINO DL Workbench
 Yaml syntax validator

 Copyright (c) 2021 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
