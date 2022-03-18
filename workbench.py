"""
 OpenVINO DL Workbench
 Entry point for launching profiler BE

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

from pathlib import Path

from wb import create_app, get_config, configure_app
from wb.extensions_factories.socket_io import get_socket_io_server
from wb.utils.logger import initialize_workbench_logger

# Make sure `SERVER_MODE` is imported after config
# pylint: disable=using-constant-test
if get_config:
    from config.constants import SERVER_MODE

initialize_workbench_logger()

APP = create_app()

CONFIG = get_config()
configure_app(APP, CONFIG)

if SERVER_MODE == 'development':
    # pylint: disable=ungrouped-imports
    from wb.utils.git_hooks_checker import GitHookChecker

    GitHookChecker(wb_root_path=Path(__file__).resolve().parent).check()

if __name__ == '__main__':
    SOCKET_IO = get_socket_io_server()
    SOCKET_IO.run(APP, host=CONFIG.app_host, port=CONFIG.app_port)
