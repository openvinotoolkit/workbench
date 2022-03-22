"""
 OpenVINO DL Workbench
 Class for ORM model describing a proxy for remote host

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
import re
from typing import Tuple

from sqlalchemy import Column, Integer, String

from wb.main.models.base_model import BaseModel


class ProxyModel(BaseModel):
    __tablename__ = 'proxies'

    id = Column(Integer, autoincrement=True, primary_key=True)

    host = Column(String)
    port = Column(Integer)
    username = Column(String, nullable=True)
    password = Column(String, nullable=True)

    def __init__(self, data: dict):
        self.host = data['host']
        self.port = data['port']
        self.username = data.get('username')
        self.password = data.get('password')

    def update(self, data: dict):
        self.host = data.get('host', self.host)
        self.port = data.get('port', self.port)
        self.username = data.get('username', self.username)
        self.password = data.get('password', self.password)

    def json(self) -> dict:
        json_message = {
            'host': self.host,
            'port': self.port,
        }
        if self.username:
            json_message['username'] = self.username

        if self.password:
            json_message['password'] = ''  # nosec: hardcoded_password_string

        return json_message

    def get_url(self) -> str:
        if not self.username or not self.password:
            return '{}:{}'.format(self.host, self.port)
        protocol, hostname = self.get_protocol_and_hostname()
        return '{}{}@{}:{}'.format(protocol, self.auth_credentials, hostname, self.port)

    @property
    def auth_credentials(self) -> str:
        return '{}:{}'.format(self.username, self.password) if self.username and self.password else ''

    def get_protocol_and_hostname(self) -> Tuple[str, str]:
        protocol = re.findall(r'https?://', self.host)
        hostname = self.host.split('://')[-1]
        return (protocol[0], hostname) if protocol else ('', hostname)
