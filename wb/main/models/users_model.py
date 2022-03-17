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
import hashlib
import secrets

from sqlalchemy import Column, String, Integer

from config.constants import DEFAULT_SALT_SIZE
from wb.main.models.base_model import BaseModel


class UsersModel(BaseModel):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, nullable=False)
    login_token_hash = Column(String, nullable=False)
    url_token_hash = Column(String, nullable=True)
    salt = Column(String, nullable=False)
    url_salt = Column(String, nullable=False)

    def __init__(self,
                 username: str,
                 login_token: str,
                 url_token: str):
        self.username = username
        self.salt = secrets.token_hex(DEFAULT_SALT_SIZE)
        self._generate_url_salt()
        self.login_token_hash = self.hash_login_token(login_token)
        self.url_token_hash = self.hash_url_token(url_token)

    def set_login_token(self, token):
        self.login_token_hash = self.hash_login_token(token)

    def set_url_token(self, token):
        self._generate_url_salt()
        self.url_token_hash = self.hash_url_token(token)

    def json(self) -> dict:
        return {
            'userId': self.id,
            'username': self.username
        }

    def is_correct_login_token(self, login_token: str) -> bool:
        return self.hash_login_token(login_token) == self.login_token_hash

    def is_correct_url_token(self, url_token: str) -> bool:
        return self.hash_url_token(url_token) == self.url_token_hash

    def hash_login_token(self, login_token: str) -> str:
        return hashlib.sha512((login_token + self.salt).encode()).hexdigest()

    def hash_url_token(self, url_token: str) -> str:
        return hashlib.sha512((url_token + self.url_salt).encode()).hexdigest()

    def _generate_url_salt(self):
        self.url_salt = secrets.token_hex(DEFAULT_SALT_SIZE)
