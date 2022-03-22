"""
 OpenVINO DL Workbench
 Class for ORM model described User

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

from sqlalchemy import Column, Integer, ForeignKey, Boolean
from sqlalchemy.orm import backref, relationship

from wb.config.application import get_config
from wb.main.models.base_model import BaseModel


class UserMetadataModel(BaseModel):
    __tablename__ = 'user_metadata'

    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True, nullable=False)
    viewed_warning = Column(Boolean, default=False, nullable=False)
    agreed_cookies = Column(Boolean, default=True, nullable=False)

    user = relationship('UsersModel',
                        backref=backref('metadata', lazy='subquery'),
                        foreign_keys=[user_id],
                        cascade='delete,all')

    def __init__(self, user_id: int, viewed_warning: bool = False):
        self.user_id = user_id
        self.viewed_warning = viewed_warning

    def json(self) -> dict:
        viewed_warning = self.viewed_warning
        agreed_cookies = self.agreed_cookies
        if get_config().IS_TEST_DEV:
            viewed_warning = True
            agreed_cookies = False
        return {
            'viewedWarning': viewed_warning,
            'agreedCookies': agreed_cookies,
        }
