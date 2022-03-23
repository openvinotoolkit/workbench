"""
 OpenVINO DL Workbench
 Yaml utils

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

from typing import Optional, List, Tuple

import yaml

from wb.main.accuracy.config_validation.validation_error import RangeMark, Mark, ACValidationError


class _SafeMarkLoader(yaml.SafeLoader):
    # pylint: disable=too-many-ancestors
    def construct_mapping(self, node: yaml.MappingNode, deep=False):
        """
        Instruments a scalar node with a Mark like dict
        """
        mapping = super().construct_mapping(node, deep=deep)

        for key_node, _ in node.value:
            if isinstance(key_node, yaml.ScalarNode):
                mapping[f'__{key_node.value}__'] = {
                    'start': {'line': key_node.start_mark.line + 1, 'column': key_node.start_mark.column + 1},
                    'end': {'line': key_node.end_mark.line + 1, 'column': key_node.end_mark.column + 1}
                }

        mapping['__item__'] = {
            'start': {'line': node.start_mark.line + 1, 'column': 1},
            'end': {'line': node.start_mark.line + 1, 'column': node.start_mark.column + 1}
        }
        return mapping


def _find_mark(instrumented_config: dict, path: str) -> Optional[dict]:
    """
    Find mark in instrumented config by path
    :param instrumented_config: { field1: 'a', field2: 'b', '__line__': 0, '__field1__': {
        'start': {'line': 1, 'column': 1}, 'end': {...}
    }}
    :param path: field1.0.field2.1
    :return: {'start': {'line': 1, 'column': 1}, 'end': {...}}
    """
    value = instrumented_config
    mark = None
    for key in path.split('.'):
        if isinstance(value, dict):
            mark = value.get(f'__{key}__')
            value = value.get(key)
        elif isinstance(value, list):
            value = value[int(key)]
            mark = value.get('__item__')

    return mark


def _find_errors_marks(config: str, paths: List[str]) -> List[Optional[RangeMark]]:
    instrumented_dict = yaml.load(config, Loader=_SafeMarkLoader)  # nosec
    marks: List[Optional[RangeMark]] = []
    for path in paths:
        try:
            mark = _find_mark(instrumented_dict, path)
            marks.append(RangeMark(
                Mark(mark['start']['line'], mark['start']['column']),
                Mark(mark['end']['line'], mark['end']['column']))
            )
        except Exception:
            marks.append(None)

    return marks


def fill_error_marks(config: str, errors: Tuple[ACValidationError]) -> Tuple[ACValidationError]:
    marks: List[Optional[RangeMark]] = _find_errors_marks(config, [error.path for error in errors])

    for index, error in enumerate(errors):
        error.mark = marks[index]

    return errors
