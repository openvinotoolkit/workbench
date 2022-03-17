"""
 OpenVINO DL Workbench
 Class for ORM model described Devices

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
