"""
 OpenVINO DL Workbench
 Tool for checking pre-configured python environment

 Copyright (c) 2020 Intel Corporation

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

import argparse
import os
import re
import shutil
import sys
from enum import Enum
from subprocess import Popen, PIPE  # nosec: blacklist
# pylint: disable=import-error
import semver


class OSVersion(Enum):
    all = 'all'
    ubuntu20 = 'ubuntu20.04'
    ubuntu18 = 'ubuntu18.04'


TOOLS = ('benchmark_app', 'accuracy_check', 'pot')

COMMON_DEPENDENCIES = {
    'numpy': {OSVersion.all: '1.19.5', },
    'Cython': {OSVersion.all: '0.29.14', },
    'py-cpuinfo': {OSVersion.all: '7.0.0', },
    'psutil': {OSVersion.all: '5.7.0', },
    'pycocotools': {OSVersion.all: '2.0.2', },
    'datumaro': {OSVersion.all: '0.2.1', },
}


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--python-environment-path', type=str,
                        required=True,
                        help='Path to virtual python environment. '
                             'For example /var/bin/wb_python_2021.1')
    parser.add_argument('--validate', action='store_true',
                        help='Validate an existing python environment')
    parser.add_argument('--scope', type=str, default='full',
                        choices=['full', 'profiling', 'calibration', 'accuracy'],
                        help='Scope for what virtual environment will be setup')
    parser.add_argument('--runtime-wheel', type=str, required=True,
                        help='Path to the runtime OV wheel')
    parser.add_argument('--dev-wheel', type=str, required=True,
                        help='Path to the dev OV wheel')
    return parser.parse_args()


def execute(command: list) -> tuple:
    result = Popen(command, stdout=PIPE, stderr=PIPE)  # nosec
    output = result.stdout.read().decode('utf-8')
    exit_code = result.poll()
    error_message = result.stderr.read().decode('utf-8')
    if exit_code:
        print(f'Command {" ".join(command)} failed: {error_message}')
    if error_message:
        print(error_message)
    return output, error_message, exit_code


def check_python_version(python_executable: str):
    command = [python_executable, '--version']
    output, _, _ = execute(command)
    version_pattern = re.compile(r'Python (?P<version>(\d+\.?)+)')
    match = version_pattern.search(output)
    if not match:
        raise AssertionError(f'Cannot find python ({python_executable}) version ')

    version_str = match.group('version')
    version = semver.VersionInfo.parse(version_str)

    supported_minor_versions = (6, 7, 8)
    if int(version.major) != 3 or int(version.minor) not in supported_minor_versions:
        raise AssertionError(f'Python{version.major}.{version.minor} is not supported')


def manual_check_pip_version(python_executable: str):
    command = [python_executable, '-m', 'pip', '--version']
    output, _, _ = execute(command)
    version_pattern = re.compile(r'pip (?P<major_version>\d+)\.(?P<minor_version>\d).*')
    match = version_pattern.search(output)
    if not match:
        raise AssertionError(f'Cannot find pip ({python_executable}) version')

    major_version = match.group('major_version')

    supported_major_versions = 18
    if int(major_version) < supported_major_versions:
        raise AssertionError(f'pip {major_version} is not supported')


def check_pip_version(python_executable: str):
    command = [python_executable, '-m', 'pip', '--version']
    output, _, _ = execute(command)
    version_pattern = re.compile(r'pip (?P<version>(\d+\.?)+)')
    match = version_pattern.search(output)
    if not match:
        raise AssertionError(f'Cannot find pip ({python_executable}) version')

    version_str = match.group('version')
    try:
        version = semver.VersionInfo.parse(version_str)
    except ValueError:
        manual_check_pip_version(python_executable)
        return
    supported_major_versions = 18
    if int(version.major) < supported_major_versions:
        raise AssertionError(f'pip {version.major} is not supported')


def install(python_executable: str, package: str, min_version: str, max_version: str = None):
    package_str = f'{package}=={min_version}'
    if max_version:
        package_str = f'{package}>={min_version},<{max_version}'
    print(f'Installing {package_str} using {python_executable}')
    to_user_dir = ['--user'] if python_executable == sys.executable else []

    execute([python_executable, '-m', 'pip', 'install', *to_user_dir, package_str])


def install_common_dependencies_from_pypi(python_executable: str):

    for dependency, versions in COMMON_DEPENDENCIES.items():

        install(
            python_executable=python_executable,
            package=dependency,
            min_version=versions[OSVersion.all]
        )


def install_from_whl(python_executable: str, whl_path):
    execute([python_executable, '-m', 'pip', 'install', whl_path])


def upgrade(python_executable: str, package: str, version: str):
    package_str = f'{package}=={version}'
    print(f'Upgrading {package_str} using {python_executable}')
    to_user_dir = ['--user'] if python_executable == sys.executable else []

    execute([python_executable, '-m', 'pip', 'install', '--upgrade', *to_user_dir, package_str])


def create_python_virtual_environment(virtual_env_path: str):
    install(sys.executable, 'virtualenv', '20.3.1')
    command = [sys.executable, '-m', 'virtualenv', '-p', sys.executable, virtual_env_path]
    execute(command)
    install(sys.executable, 'virtualenv', '20.3.1')
    virtual_env_python = get_tool_executable(virtual_env_path, 'python')
    install(virtual_env_python, 'setuptools', '51.3.3')
    upgrade(virtual_env_python, 'pip', '21.1.1')


def get_tool_executable(virtual_env_path: str, tool: str) -> str:
    return os.path.join(virtual_env_path, 'bin', tool)


def clear_python_env(virtual_env_path: str):
    if os.path.isdir(virtual_env_path):
        shutil.rmtree(virtual_env_path)


def validate_installed_tools(virtual_env_path: str) -> int:
    virtual_env_python = get_tool_executable(virtual_env_path, 'python')
    exit_code = 0
    for tool in TOOLS:
        tool_executable = get_tool_executable(virtual_env_path, tool)
        exit_code = execute([virtual_env_python, tool_executable, '-h'])[2] or exit_code
        if not exit_code:
            print(f'{tool} is working correctly.')
    return exit_code


if __name__ == '__main__':
    ARGS = parse_args()
    PYTHON_ENVIRONMENT_PATH = ARGS.python_environment_path
    PYTHON_EXECUTABLE = get_tool_executable(PYTHON_ENVIRONMENT_PATH, 'python')
    RUNTIME_WHEEL = ARGS.runtime_wheel
    DEV_WHEEL = ARGS.dev_wheel
    if not ARGS.validate:
        check_python_version(sys.executable)
        check_pip_version(sys.executable)
        clear_python_env(PYTHON_ENVIRONMENT_PATH)
        create_python_virtual_environment(PYTHON_ENVIRONMENT_PATH)
        install_common_dependencies_from_pypi(PYTHON_EXECUTABLE)
        install_from_whl(PYTHON_EXECUTABLE, RUNTIME_WHEEL)
        install_from_whl(PYTHON_EXECUTABLE, DEV_WHEEL)
        print('Environment setup completed successfully')
    check_python_version(PYTHON_EXECUTABLE)
    EXIT_CODE = validate_installed_tools(PYTHON_ENVIRONMENT_PATH)
    if EXIT_CODE:
        print('Environment validation failed')
    else:
        print('Environment validation completed successfully')
    sys.exit(EXIT_CODE)
