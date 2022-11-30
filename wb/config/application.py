"""
 OpenVINO DL Workbench
 Classes and functions for configure Flask application

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
import datetime
import secrets
from typing import Type

from config.constants import DEFAULT_TOKEN_SIZE, \
    DB_NAME, DB_URL, DB_USERNAME, DB_PASSWORD, \
    BROKER_HOST, BROKER_USER, BROKER_VHOST, BROKER_PASSWORD, \
    IS_TEST_DEV, SSL_VERIFIED_ENABLED, API_PORT, PROXY_PORT, APP_HOST, IS_TLS_ENABLED, ENABLE_AUTH, \
    SAVE_TOKEN_TO_FILE, JWT_SECRET_KEY, PUBLIC_PORT, WORKBENCH_NETWORK_ALIAS, SERVER_MODE, BASE_PREFIX


class Config:
    # app
    app_host = APP_HOST
    app_port = API_PORT
    proxy_port = PROXY_PORT
    public_port = PUBLIC_PORT

    workbench_network_alias = WORKBENCH_NETWORK_ALIAS

    ssl_verify_enabled = SSL_VERIFIED_ENABLED

    IS_TEST_DEV = IS_TEST_DEV

    SESSION_COOKIE_SECURE = True

    # celery config
    broker_url = f'amqp://{BROKER_USER}:{BROKER_PASSWORD}@{BROKER_HOST}/{BROKER_VHOST}'
    celery_backend_url = 'rpc://'
    worker_prefetch_multiplier = 1
    task_acks_late = True
    imports = ['wb.main.tasks.task']

    # JWT config
    JWT_SECRET_KEY = secrets.token_hex(DEFAULT_TOKEN_SIZE) if ENABLE_AUTH else JWT_SECRET_KEY
    JWT_TOKEN_LOCATION = ('headers', 'cookies')
    JWT_COOKIE_CSRF_PROTECT = True
    JWT_COOKIE_SECURE = IS_TLS_ENABLED
    JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(minutes=10) if ENABLE_AUTH else False
    JWT_REFRESH_TOKEN_EXPIRES = datetime.timedelta(days=15) if ENABLE_AUTH else False

    # SSL config
    is_tls_enabled = IS_TLS_ENABLED

    # Token saving to file
    save_token_to_file = SAVE_TOKEN_TO_FILE

    @classmethod
    def _get_protocol_prefix(cls) -> str:
        return 'https' if cls.is_tls_enabled else 'http'

    @classmethod
    def _get_app_protocol_and_host(cls) -> str:
        return f'{cls._get_protocol_prefix()}://{cls.app_host}'

    @classmethod
    def get_public_app_url(cls) -> str:
        return f'{cls._get_app_protocol_and_host()}:{cls.public_port}{BASE_PREFIX}'

    @classmethod
    def get_url_for_cloud(cls) -> str:
        return f'{cls._get_protocol_prefix()}://{cls.workbench_network_alias}:{cls.proxy_port}'


class ProductionConfig(Config):
    # database config
    SQLALCHEMY_DATABASE_URI = f'postgresql+pg8000://{DB_USERNAME}:{DB_PASSWORD}@{DB_URL}/{DB_NAME}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class DevelopmentConfig(ProductionConfig):
    # Disable JWT secret key generation for development environment
    JWT_SECRET_KEY = JWT_SECRET_KEY


class TestingConfig(ProductionConfig):
    TESTING = True
    WTF_CSRF_ENABLED = False


def get_config() -> Type[Config]:
    configs = {
        'testing': TestingConfig,
        'development': DevelopmentConfig,
        'production': ProductionConfig
    }
    return configs[SERVER_MODE]
