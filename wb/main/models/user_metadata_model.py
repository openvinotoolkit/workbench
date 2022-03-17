"""
 OpenVINO DL Workbench
 Class for ORM model described User

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
