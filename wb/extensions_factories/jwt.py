"""
 OpenVINO DL Workbench
 Classes and functions creating and working with instance of JWT Manager

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
from flask_jwt_extended import JWTManager


# Temporary blacklist for revoked tokens
BLACKLIST = set()


def get_jwt() -> JWTManager:
    return get_jwt.JWTManager


get_jwt.JWTManager = JWTManager()


def init_jwt(app):
    get_jwt().init_app(app)
