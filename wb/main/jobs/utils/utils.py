"""
 OpenVINO DL Workbench
 Utils functions using in jobs

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
import os
from contextlib import closing
from functools import wraps

from sqlalchemy.orm import Session

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.sh_tools.default_parameters import DefaultRemoteParameters, DefaultLocalParameters
from wb.main.console_tool_wrapper.sh_tools.tools import PingTargetTool
from wb.main.jobs.tools_runner.wb_sftp_client import WBSFTPClient
from wb.main.jobs.tools_runner.wb_ssh_client import WBSSHClient
from wb.main.enumerates import TargetTypeEnum
from wb.main.models import TopologiesModel, DatasetsModel
from wb.main.models.remote_target_model import RemoteTargetModel
from wb.main.models.target_model import TargetModel
from wb.main.scripts.job_scripts_generators import RemoteProfilingConfigurationFileGenerator


def add_session(func):
    """Provide database session to `func`."""

    @wraps(func)
    def wrapper(*args, **kwargs):
        session = get_db_session_for_celery()
        with closing(session):
            kwargs['session'] = session
            return func(*args, **kwargs)

    return wrapper


def collect_artifacts(target_id: int, source_path: str, destination_path: str, session: Session):
    target: TargetModel = session.query(TargetModel).get(target_id)
    if target.target_type == TargetTypeEnum.remote:
        collect_from_remote_target(source_path, destination_path, target_id, session)


def collect_from_remote_target(artifact_path: str, destination_path: str,
                               target_id: id, session: Session):
    target: RemoteTargetModel = session.query(RemoteTargetModel).get(target_id)
    host = target.host
    username = target.username
    private_key_path = target.private_key_path
    port = target.port

    wb_ssh_client = WBSSHClient(host, username, private_key_path=private_key_path, port=port)
    ssh_handler = WBSFTPClient(wb_ssh_client)
    ssh_handler.copy_from_target(artifact_path, destination_path)


def fill_ping_parameters(target_id: int, tool: PingTargetTool, session: Session,
                         artifact_name: str = 'artifact.json'):
    fillers = {
        TargetTypeEnum.local: lambda: fill_ping_parameters_for_local_target(target_id, tool, artifact_name),
        TargetTypeEnum.remote: lambda: fill_ping_parameters_for_remote_target(target_id, tool, artifact_name,
                                                                              session),
    }

    target = session.query(TargetModel).get(target_id)

    fillers[target.target_type]()


def fill_ping_parameters_for_local_target(target_id: int, tool: PingTargetTool,
                                          artifact_name: str = 'artifact.json'):
    default_parameters = DefaultLocalParameters(target_id, artifact_name)
    fill_ping_parameters_from_default(tool, default_parameters)


def fill_ping_parameters_for_remote_target(target_id: int, tool: PingTargetTool,
                                           artifact_name: str = 'artifact.json', session: Session = None):
    target = session.query(RemoteTargetModel).get(target_id)
    default_parameters = DefaultRemoteParameters(target.bundle_path, artifact_name)
    fill_ping_parameters_from_default(tool, default_parameters)


def fill_ping_parameters_from_default(tool: PingTargetTool, default_parameters):
    tool.set_output_path_parameter(default_parameters.output)


def set_assets_path_for_remote_target(config: dict, topology: TopologiesModel, dataset: DatasetsModel):
    xml_remote_path, _ = RemoteProfilingConfigurationFileGenerator.get_model_path(topology)
    model_path = os.path.dirname(xml_remote_path)
    xml_remote_path = f'$JOB_BUNDLE_PATH/{model_path}'
    dataset_remote_path = f'$JOB_BUNDLE_PATH/dataset'

    replace_local_path_with_remote_path(config, topology.path, xml_remote_path)
    replace_local_path_with_remote_path(config, dataset.path, dataset_remote_path)


def replace_local_path_with_remote_path(config: dict, local_path: str, remote_path: str):
    if not isinstance(config, dict):
        return
    for key, value in config.items():
        if isinstance(value, str) and local_path in value:
            config[key] = value.replace(local_path, remote_path)
        if isinstance(value, dict):
            replace_local_path_with_remote_path(value, local_path, remote_path)
        if isinstance(value, list):
            for val in value:
                replace_local_path_with_remote_path(val, local_path, remote_path)
