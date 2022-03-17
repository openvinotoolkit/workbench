"""
 OpenVINO DL Workbench
 Entry point for launching profiler BE

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
