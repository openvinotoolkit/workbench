"""
 OpenVINO DL Workbench
 Profiler utilities functions

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
import io
import logging as log
import os
import re
import secrets
import shutil
import time
from pathlib import Path
from typing import Union, Iterable

import paramiko
from flask import current_app

from config.constants import (DATA_TYPE_TO_PRECISION, TOKEN_FILENAME, TOKEN_FILE_DIR,
                              TARGETS_FOLDER, FILE_PERMISSION, FOLDER_PERMISSION, DEFAULT_TOKEN_SIZE, ENABLE_AUTH,
                              CUSTOM_TOKEN)
from wb.config.application import get_config
from wb.error.ssh_client_error import SshAuthKeyContentError, SshAuthKeyNameError
from wb.main.enumerates import SupportedFrameworksEnum, SSHAuthStatusMessagesEnum
from wb.main.shared.utils import find_all_paths_by_exts


def remove_dir(dir_path: str):
    if dir_path and os.path.exists(dir_path):
        shutil.rmtree(dir_path)
        while True:
            try:
                print(f'[DEBUG LOG] Trying to remove directory {dir_path}')
                os.makedirs(dir_path)
            except FileExistsError:
                # If problem is that directory still exists, wait a bit and try again
                # this is the known issue: https://bit.ly/2I5vkZY
                print(f'[DEBUG LOG] FileExistsError, sleeping for directory removal')
                time.sleep(0.01)
            else:
                print(f'[DEBUG LOG] Directory does not exist anymore, quiting the loop')
                os.sync()
                break
        shutil.rmtree(dir_path)
        print(f'[DEBUG LOG] Directory removed, syncing')
        os.sync()


def create_empty_dir(path):
    if os.path.exists(path):
        remove_dir(path)
    os.makedirs(path, exist_ok=True)


def chmod_dir_recursively(path: str):
    set_permission(path, mode=FOLDER_PERMISSION)
    for root_path, directories, filenames in os.walk(path):
        for directory in directories:
            set_permission(os.path.join(root_path, directory), mode=FOLDER_PERMISSION)
        for filename in filenames:
            set_permission(os.path.join(root_path, filename), mode=FILE_PERMISSION)


def set_permission(path: str, mode: int):
    os.chmod(path, mode=mode)


def write_to_file(path_to_file: str, content: str):
    path_to_dir = os.path.dirname(path_to_file)
    if not os.path.exists(path_to_dir):
        create_empty_dir(path_to_dir)
    with open(path_to_file, 'w') as token_file:
        token_file.write(content)


def get_token_from_file() -> str or None:
    token_file_path = os.path.join(TOKEN_FILE_DIR, TOKEN_FILENAME)
    if os.path.exists(token_file_path):
        with open(token_file_path, 'r') as token_file:
            return token_file.read()
    else:
        return None


def generate_token_or_get_from_file() -> str:
    login_token = get_token_from_file()
    if not login_token:
        login_token = CUSTOM_TOKEN or secrets.token_hex(DEFAULT_TOKEN_SIZE)
        if get_config().save_token_to_file:
            token_file_path = os.path.join(TOKEN_FILE_DIR, TOKEN_FILENAME)
            write_to_file(token_file_path, login_token)
            set_permission(token_file_path, mode=FILE_PERMISSION)
    return login_token


def save_private_key(target_id: int, key_content: str, key_name: str) -> str:
    path = os.path.join(TARGETS_FOLDER, str(target_id), key_name)
    write_to_file(path, key_content)
    return path


def check_ssh_key_validity(key_content: str, key_name: str):
    # create in memory file-like object
    file_obj = io.StringIO(key_content)
    try:
        paramiko.RSAKey.from_private_key(file_obj=file_obj)
    except paramiko.SSHException as exception:
        log.error('Error %s', exception)
        raise SshAuthKeyContentError(SSHAuthStatusMessagesEnum.INCORRECT_KEY_CONTENT.value)
    filename_pattern = re.compile(r'[\w\-]+$')
    if not re.fullmatch(filename_pattern, key_name):
        raise SshAuthKeyNameError(SSHAuthStatusMessagesEnum.INCORRECT_KEY_NAME.value)


def find_by_ext(dir_path: Union[str, Path], extension: str, recursive=False) -> str:
    """
    Return file path by its parent directory path and extension.

    Does not search in subdirectories.
    Raises:
        StopIteration: If nothing found.
    """
    return next(find_all_paths_by_exts(dir_path, (extension,), recursive=recursive))


def get_size_of_files(path: str) -> float:
    if os.path.isdir(path):
        size = sum(
            os.path.getsize(os.path.join(dir_path, filename))
            for dir_path, _, filenames in os.walk(path)
            for filename in filenames
        )
    else:
        size = os.path.getsize(os.path.join(path))
    return FileSizeConverter.bytes_to_mb(size)


class FileSizeConverter:
    _bytes_in_mb = 1024 ** 2

    @staticmethod
    def bytes_to_mb(file_size_in_bytes: float) -> float:
        if not file_size_in_bytes:
            raise ValueError('Invalid file size in bytes provided')
        return file_size_in_bytes / FileSizeConverter._bytes_in_mb


def to_camel_case(snake_str: str) -> str:
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


def to_snake_case(camel_str: str) -> str:
    return to_snake_case.camel_case_pattern.sub('_', camel_str).lower()


to_snake_case.camel_case_pattern = re.compile(r'(?<!^)(?=[A-Z])')


def unify_precision_names(data_types: Iterable) -> list:
    return list(set(DATA_TYPE_TO_PRECISION.get(data_type) or data_type for data_type in data_types))


def get_framework_name(framework: SupportedFrameworksEnum) -> str:
    return SupportedFrameworksEnum.tf.value if \
        framework in (SupportedFrameworksEnum.tf2, SupportedFrameworksEnum.tf2_keras) else framework.value


def print_app_url_info(is_regenerated: bool):
    app_config = get_config()
    app_available_with_link_message = f'DL Workbench is available at {app_config.get_public_app_url()}'
    if not ENABLE_AUTH:
        print(f'{app_available_with_link_message}. \n\n')
        return
    url_token = current_app.config.url_token
    current_app.config.url_token = None
    if is_regenerated:
        print(f'New link was generated: \n')
    print(f'{app_available_with_link_message}?token={url_token}. \n\n'
          'Note:  Authentication with the token inside this link is available only once.\n'
          f'The link expires after you click it. Use your login token at {app_config.get_public_app_url()} to '
          'authenticate again.\n\n')
