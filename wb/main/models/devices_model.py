"""
 OpenVINO DL Workbench
 Class for ORM model described Devices

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
import json

from sqlalchemy import Column, String, Integer, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship, backref

from wb.main.models.base_model import BaseModel


class DevicesModel(BaseModel):
    __tablename__ = 'devices'

    id = Column(Integer, primary_key=True, autoincrement=True)
    target_id = Column(Integer, ForeignKey('targets.id'))

    type = Column(String, nullable=False)
    product_name = Column(String, nullable=False)
    device_name = Column(String, nullable=False)
    active = Column(Boolean, default=True)
    optimization_capabilities = Column(Text, nullable=False)
    range_infer_requests = Column(Text, nullable=False)
    range_streams = Column(Text, nullable=True)

    target = relationship('TargetModel', backref=backref('devices', cascade='all,delete-orphan'))

    # pylint: disable=too-many-arguments
    def __init__(self,
                 target_id: int,
                 device_type: str,
                 device_name: str,
                 product_name: str,
                 optimization_capabilities: tuple,
                 range_infer_requests: dict,
                 range_streams: dict or None):
        self.target_id = target_id
        self.type = device_type
        self.product_name = product_name
        self.device_name = device_name
        self.optimization_capabilities = json.dumps(optimization_capabilities)
        self.range_infer_requests = json.dumps(range_infer_requests)
        self.range_streams = json.dumps(range_streams) if range_streams is not None else range_streams

    def json(self) -> dict:
        data = {
            'id': self.id,
            'targetId': self.target_id,
            'type': self.type,
            'active': self.active,
            'productName': self.product_name,
            'deviceName': self.device_name,
            'optimizationCapabilities': json.loads(self.optimization_capabilities),
            'rangeForAsyncInferRequests': json.loads(self.range_infer_requests),
        }
        if self.range_streams:
            data['rangeForStreams'] = json.loads(self.range_streams)
        return data
