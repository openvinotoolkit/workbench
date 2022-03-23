"""
 OpenVINO DL Workbench
 Class for ORM model describing a target machine

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
from abc import abstractmethod
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship

from config.constants import WORKBENCH_HIDDEN_FOLDER, DEFAULT_PORT_ON_TARGET
from wb.main.enumerates import PipelineTypeEnum, TargetStatusEnum, TargetTypeEnum, DeviceTypeEnum, \
    TargetOSEnum
from wb.main.models.base_model import BaseModel
from wb.main.models.cpu_info_model import CPUInfoModel
from wb.main.models.enumerates import TARGET_TYPE_ENUM_SCHEMA, TARGET_OS_ENUM_SCHEMA
from wb.main.models.system_resources_model import SystemResourcesModel


class TargetModel(BaseModel):
    __tablename__ = 'targets'

    target_type = Column(TARGET_TYPE_ENUM_SCHEMA, nullable=False)

    __mapper_args__ = {
        'polymorphic_on': target_type,
    }

    id = Column(Integer, primary_key=True, autoincrement=True)

    name = Column(String, nullable=False)
    host = Column(String, nullable=False)
    port = Column(Integer, nullable=False, default=DEFAULT_PORT_ON_TARGET)
    username = Column(String, nullable=False)
    home_directory = Column(String, nullable=True)
    operating_system = Column(TARGET_OS_ENUM_SCHEMA, nullable=False,
                              default=TargetOSEnum.ubuntu18)
    cpu_info_id = Column(Integer, ForeignKey(CPUInfoModel.id), nullable=True)
    system_resources_id = Column(Integer, ForeignKey(SystemResourcesModel.id), nullable=True)

    # Relationship fields
    devices: List['DevicesModel']
    pipelines: List['PipelineModel']
    cpu_info = relationship(CPUInfoModel, cascade='delete,all')
    system_resources = relationship(SystemResourcesModel, cascade='delete,all')

    @property
    def bundle_path(self) -> str:
        return os.path.join(self.home_directory, WORKBENCH_HIDDEN_FOLDER)

    def _get_pipelines_by_type(self, pipeline_type: PipelineTypeEnum) -> List['PipelineModel']:
        return [pipeline for pipeline in self.pipelines if pipeline.type == pipeline_type]

    def _get_last_pipeline_by_type(self, pipeline_type: PipelineTypeEnum) -> Optional['PipelineModel']:
        filtered_pipelines = self._get_pipelines_by_type(pipeline_type)
        return filtered_pipelines[-1] if filtered_pipelines else None

    @property
    def latest_pipelines(self) -> List['PipelineModel']:
        result = {}
        for current_pipeline in self.pipelines:
            saved_pipeline = result.get(current_pipeline.type)
            if not saved_pipeline or current_pipeline.last_modified > saved_pipeline.last_modified:
                result[current_pipeline.type] = current_pipeline
        return list(result.values())

    @property
    @abstractmethod
    def last_connected(self) -> Optional[datetime]:
        raise NotImplementedError('Implement method for getting last connected timestamp')

    @property
    @abstractmethod
    def last_connection_status(self) -> TargetStatusEnum:
        raise NotImplementedError('Implement method for getting last connected status')

    def json(self) -> dict:
        json_data = {
            'targetId': self.id,
            'targetType': self.target_type.value,
            'name': self.name,
            'host': self.host,
            'port': self.port,
            'username': self.username,
            'operatingSystem': self.operating_system.value,
            'lastConnectionStatus': self.last_connection_status.value,
            'lastConnected': self.last_connected.replace(
                tzinfo=timezone.utc).timestamp() * 1000 if self.last_connected else None
        }
        if self.system_resources:
            json_data.update({
                'systemResources': self.system_resources.json()
            })
        if self.cpu_info:
            json_data.update({
                'cpuInfo': self.cpu_info.json()
            })
        if self.devices:
            result_devices = self.devices
            # Filter out HDDL devices for remote targets
            if self.target_type != TargetTypeEnum.local:
                result_devices = filter(lambda device: device.type != DeviceTypeEnum.HDDL.value, result_devices)
            json_data.update({
                'devices': [device.json() for device in result_devices if device.active]
            })
        return json_data
