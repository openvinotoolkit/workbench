"""
 OpenVINO DL Workbench
 Accuracy checker schema validator

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
import copy
import logging
import os
from typing import Optional, Tuple, Callable

from openvino.tools.accuracy_checker.config import PathField
from openvino.tools.accuracy_checker.evaluators import ModelEvaluator
from openvino.tools.accuracy_checker.utils import get_path

from wb.main.accuracy.config_validation.validation_error import ACValidationError
from wb.main.accuracy.path_prefixes import ACConfigPathPrefix


def validate(config: dict, model_path: str, dataset_path: str) -> Tuple[
    Optional[Tuple[ACValidationError]], Optional[dict]
]:
    original_path_field_validate = PathField.validate

    sanitized_config: dict = copy.deepcopy(config)

    # patch PathField to validate all config paths
    # pylint: disable=fixme
    # TODO: define dedicated api
    PathField.validate = _get_validate_fn(model_path, dataset_path, sanitized_config)

    try:
        errors = ModelEvaluator.validate_config(config)
    except Exception as error:
        logging.error(error)
        return (ACValidationError('Not valid accuracy checker config schema'),), None
    finally:
        PathField.validate = original_path_field_validate
    if not errors:
        return None, sanitized_config

    serializable_errors: Tuple[ACValidationError] = tuple(
        ACValidationError(error.message, None, error.entry, error.field_uri) for error in errors
    )

    return serializable_errors, None


def _set_by_path(obj: dict, path: str, value):
    """
    Sets a structure value by a given path
    :param obj: {objects: [{nested_property: 1}, {nested_property: 2}]}
    :param path: objects.1.nested_property
    :param value: 1
    :return: {objects: [{nested_property: 1}, {nested_property: 1}]}
    """
    path_parts = path.split('.')
    last_part = path_parts.pop()
    for key in path_parts:
        if isinstance(obj, dict):
            obj = obj.get(key)
        elif isinstance(obj, list):
            obj = obj[int(key)]

    obj[last_part] = value


def _sanitize_prefixed_path(value: str, anchor: str, base_dir: str) -> str:
    full_path = value.replace(anchor, base_dir)
    abs_path = os.path.abspath(full_path)

    if os.path.commonprefix([abs_path, base_dir]) != base_dir:
        raise FileNotFoundError

    return abs_path


def _sanitize_raw_accuracy_config_path(value: str, model_path: str, dataset_path: str) -> str:
    """
    Allow only path started with ACConfigPathAnchors
    """
    if value.startswith(ACConfigPathPrefix.MODEL_PATH.value):
        return _sanitize_prefixed_path(value, ACConfigPathPrefix.MODEL_PATH.value, model_path)

    if value.startswith(ACConfigPathPrefix.DATASET_PATH.value):
        return _sanitize_prefixed_path(value, ACConfigPathPrefix.DATASET_PATH.value, dataset_path)

    raise FileNotFoundError


def _get_validate_fn(model_path: str, dataset_path: str, sanitized_config: dict) -> Callable:
    def _validate(self: PathField, entry: str, field_uri=None, fetch_only=False, validation_scheme=None):

        error_stack = super(PathField, self).validate(entry, field_uri, fetch_only, validation_scheme)
        if entry is None:
            return error_stack

        field_uri = field_uri or self.field_uri
        try:
            sanitized_entry = _sanitize_raw_accuracy_config_path(entry, model_path, dataset_path)
            get_path(sanitized_entry, self.is_directory, self.check_exists, self.file_or_directory)
            _set_by_path(sanitized_config, field_uri, sanitized_entry)
        except TypeError:
            reason = 'values is expected to be path-like'
            if not fetch_only:
                self.raise_error(entry, field_uri, reason)
            error_stack.append(self.build_error(entry, field_uri, reason))
        except FileNotFoundError:
            reason = 'path does not exist'
            if not fetch_only:
                self.raise_error(entry, field_uri, reason)
            error_stack.append(self.build_error(entry, field_uri, reason))
        except NotADirectoryError:
            reason = 'path is not a directory'
            if not fetch_only:
                self.raise_error(entry, field_uri, reason)
            error_stack.append(self.build_error(entry, field_uri, reason))
        except IsADirectoryError:
            reason = 'path is a directory, regular file expected'
            if not fetch_only:
                self.raise_error(entry, field_uri, reason)
            error_stack.append(self.build_error(entry, field_uri, reason))

        return error_stack

    return _validate
