"""
 OpenVINO DL Workbench
 Class for ORM model describing a Remote Host

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
import os
from datetime import datetime
from typing import Optional, Tuple, List

from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy import event
from sqlalchemy.orm import relationship, Session

from config.constants import DEFAULT_PORT_ON_TARGET
from wb.main.enumerates import TargetTypeEnum, PipelineTypeEnum, TargetStatusEnum, StatusEnum, \
    AcceptableFileSizesMb
from wb.main.utils.utils import save_private_key, remove_dir
from wb.main.models.proxy_model import ProxyModel
from wb.main.models.target_model import TargetModel


class RemoteTargetModel(TargetModel):
    __tablename__ = 'remote_targets'

    __mapper_args__ = {
        'polymorphic_identity': TargetTypeEnum.remote
    }

    id = Column(Integer, ForeignKey(TargetModel.id), primary_key=True)

    private_key_path = Column(String, nullable=True)

    http_proxy_id = Column(Integer, ForeignKey(ProxyModel.id), nullable=True)
    https_proxy_id = Column(Integer, ForeignKey(ProxyModel.id), nullable=True)

    os = Column(String, nullable=True)
    has_root_privileges = Column(Boolean, nullable=True)
    has_internet_connection = Column(Boolean, nullable=True)
    python_version = Column(String, nullable=True)
    pip_version = Column(String, nullable=True)
    error = Column(String, nullable=True)

    # Relationship fields
    http_proxy = relationship(ProxyModel, foreign_keys=[http_proxy_id], cascade='delete,all')
    https_proxy = relationship(ProxyModel, foreign_keys=[https_proxy_id], cascade='delete,all')

    def __init__(self, data: dict):
        self.host = data['host']
        self.name = data.get('name', self.host)
        self.port = data.get('port', DEFAULT_PORT_ON_TARGET)
        self.username = data['username']

    @property
    def private_key_file_name(self) -> Optional[str]:
        return os.path.basename(self.private_key_path) if self.private_key_path else None

    @property
    def last_connected(self) -> Optional[datetime]:
        ping_pipelines: List['PipelineModel'] = self._get_pipelines_by_type(PipelineTypeEnum.ping)
        sorted_success_pipelines = sorted(
            [pipeline for pipeline in ping_pipelines if pipeline.pipeline_status_name == StatusEnum.ready],
            key=lambda pipeline: pipeline.last_modified, reverse=True)
        if not sorted_success_pipelines:
            return None
        return sorted_success_pipelines[0].last_modified

    # pylint: disable=too-many-return-statements
    @property
    def last_connection_status(self) -> TargetStatusEnum:
        setup_pipeline = self._get_last_pipeline_by_type(PipelineTypeEnum.setup)
        ping_pipeline = self._get_last_pipeline_by_type(PipelineTypeEnum.ping)
        rest_pipelines_status_names = [pipeline.pipeline_status_name for pipeline in self.pipelines if
                                       pipeline.type not in (PipelineTypeEnum.setup, PipelineTypeEnum.ping)]
        in_progress_statuses = [StatusEnum.running, StatusEnum.queued]

        if not setup_pipeline or setup_pipeline.pipeline_status_name == StatusEnum.error:
            return TargetStatusEnum.configuration_failure
        if not ping_pipeline or ping_pipeline.pipeline_status_name == StatusEnum.error:
            return TargetStatusEnum.connection_failure
        if not self.private_key_path or StatusEnum.cancelled in (
                setup_pipeline.pipeline_status_name, ping_pipeline.pipeline_status_name):
            return TargetStatusEnum.not_configured
        if setup_pipeline.pipeline_status_name in in_progress_statuses:
            return TargetStatusEnum.configuring
        if ping_pipeline.pipeline_status_name in in_progress_statuses:
            return TargetStatusEnum.connecting
        if set(rest_pipelines_status_names).intersection(set(in_progress_statuses)):
            return TargetStatusEnum.busy
        if ping_pipeline.pipeline_status_name == StatusEnum.ready:
            return TargetStatusEnum.available
        raise NotImplementedError('Unknown target status returned')

    def update_and_write(self, data: dict, session: Session):
        self.host = data.get('host', self.host)
        self.name = data.get('name', self.name)
        self.port = data.get('port', self.port)
        self.username = data.get('username', self.username)
        self.error = None
        private_key = data.get('privateKey')
        if private_key and isinstance(private_key, str):
            # Remove previous private key file
            if self.private_key_path and os.path.exists(self.private_key_path):
                os.remove(self.private_key_path)
            self.private_key_path = save_private_key(self.id, private_key, data['privateKeyFileName'])

        http_proxy_data = data.get('httpProxy')
        if http_proxy_data and not self.http_proxy:
            self.http_proxy_id = self._create_proxy(http_proxy_data, session)
        elif http_proxy_data and self.http_proxy:
            self.http_proxy.update(http_proxy_data)
        elif not http_proxy_data and self.http_proxy:
            self.http_proxy_id = None
            self.http_proxy.delete_record(session)

        https_proxy_data = data.get('httpsProxy')
        if https_proxy_data and not self.https_proxy:
            self.https_proxy_id = self._create_proxy(https_proxy_data, session)
        elif https_proxy_data and self.https_proxy:
            self.https_proxy.update(https_proxy_data)
        elif not https_proxy_data and self.https_proxy:
            self.https_proxy_id = None
            self.https_proxy.delete_record(session)
        self.write_record(session)

    def json(self) -> dict:
        json_data = super().json()
        json_data['privateKeyFileName'] = self.private_key_file_name
        json_data['error'] = self.error
        if self.http_proxy_id:
            json_data['httpProxy'] = self.http_proxy.json()
        if self.https_proxy_id:
            json_data['httpsProxy'] = self.https_proxy.json()
        machine_info = self.machine_info_json()
        if machine_info:
            json_data['machineInfo'] = machine_info
        return json_data

    def get_proxy_urls(self) -> Tuple[Optional[str], Optional[str]]:
        http_proxy_url = self.http_proxy.get_url() if self.http_proxy else None
        https_proxy_url = self.https_proxy.get_url() if self.https_proxy else None
        return http_proxy_url, https_proxy_url

    @staticmethod
    def _create_proxy(proxy_data: dict, session: Session) -> int:
        proxy = ProxyModel(proxy_data)
        proxy.write_record(session)
        return proxy.id

    def create_proxies(self, data: dict, session: Session):
        http_proxy_data = data.get('httpProxy')
        if http_proxy_data:
            self.http_proxy_id = self._create_proxy(http_proxy_data, session)
        https_proxy_data = data.get('httpsProxy')
        if https_proxy_data:
            self.https_proxy_id = self._create_proxy(https_proxy_data, session)
        self.write_record(session)

    def machine_info_json(self) -> dict:
        return {
            'os': self.os if self.os else None,
            'hasRootPrivileges': self.has_root_privileges if self.has_root_privileges else None,
            'hasInternetConnection': self.has_internet_connection if self.has_internet_connection else None,
            'pythonVersion': self.python_version if self.python_version else None,
            'pipVersion': self.pip_version if self.pip_version else None,
        }

    @staticmethod
    def is_key_size_valid(size: float):
        return size <= AcceptableFileSizesMb.SSH_KEY.value


@event.listens_for(RemoteTargetModel, 'after_delete')
def handle_after_delete_remote_target(_, unused_connection, target: RemoteTargetModel):
    if not target.private_key_path:
        return
    key_path = os.path.dirname(target.private_key_path)
    if os.path.exists(key_path):
        remove_dir(key_path)
