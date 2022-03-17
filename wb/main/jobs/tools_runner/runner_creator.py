"""
 OpenVINO DL Workbench
 Class for run console tool in local target

 Copyright (c) 2020 Intel Corporation

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

from sqlalchemy.orm import Session

from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser
from wb.main.console_tool_wrapper.console_tool import ConsoleTool
from wb.main.jobs.tools_runner.console_runner import ConsoleRunner
from wb.main.jobs.tools_runner.local_runner import LocalRunner
from wb.main.jobs.tools_runner.remote_runner import RemoteRunner
from wb.main.jobs.tools_runner.wb_ssh_client import WBSSHClient
from wb.main.enumerates import TargetTypeEnum
from wb.main.models.remote_target_model import RemoteTargetModel
from wb.main.models.target_model import TargetModel
from config.constants import JOBS_SCRIPTS_FOLDER


def create_runner(target_id: int, tool: ConsoleTool, parser: ConsoleToolOutputParser,
                  session: Session, working_directory: str = None) -> ConsoleRunner:
    target = session.query(TargetModel).get(target_id)
    if target.target_type == TargetTypeEnum.local:
        working_directory = working_directory or os.path.dirname(JOBS_SCRIPTS_FOLDER)
        return LocalRunner(tool, parser, working_directory)
    if target.target_type == TargetTypeEnum.remote:
        remote_target = session.query(RemoteTargetModel).get(target_id)
        wb_ssh_client = WBSSHClient(remote_target.host,
                                    remote_target.username,
                                    private_key_path=remote_target.private_key_path,
                                    port=remote_target.port)
        return RemoteRunner(tool, parser, wb_ssh_client, working_directory)
    raise Exception(f'Cannot find target with id {target_id}')
