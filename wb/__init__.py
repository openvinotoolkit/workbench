"""
 OpenVINO DL Workbench
 Entry point for defining the Flask instance

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
from flask import Flask
from flask_restful import Api

from wb.config.application import get_config
from wb.extensions_factories.celery import get_celery, init_celery_app
from wb.extensions_factories.database import init_db_app
from wb.extensions_factories.jwt import init_jwt
from wb.extensions_factories.socket_io import get_socket_io_server
from wb.main.database import data_initialization
from wb.main.jupyter_notebooks.cli_tools_options import CLIToolsOptionsCache
from wb.main.models import WBInfoModel
from wb.main.utils.dev_cloud_platforms import handshake_with_dev_cloud_service
from wb.main.utils.utils import get_token_from_file, print_app_url_info
from wb.utils.utils import init_data_folders
from config.constants import DL_WB_LOGO, ENABLE_AUTH


def create_app() -> Flask:
    """Create an application."""
    app = Flask(__name__)

    Api(app)

    with app.app_context():
        from wb.main.api_endpoints.v1 import BLUEPRINTS
        url_prefix = '/api/v1'
        for blueprint in BLUEPRINTS:
            app.register_blueprint(blueprint, url_prefix=url_prefix)

    return app


def configure_app(app: Flask, config):
    app.config.from_object(config)

    socket_io = get_socket_io_server()
    socket_io.init_app(app, async_mode='eventlet', message_queue=config.broker_url)

    init_data_folders()
    init_celery_app(app)
    init_db_app(app)

    data_initialization.initialize(app)

    init_jwt(app)
    handshake_with_dev_cloud_service(app)

    CLIToolsOptionsCache().initialize()

    print_start_message()
    with app.app_context():
        print_app_url_info(is_regenerated=False)
        print_auth_info()


def print_start_message():
    print(
        f'{DL_WB_LOGO} \n'
        f'DL Workbench version: {WBInfoModel.get_version_from_file()} \n\n'
    )


def print_auth_info():
    login_token_message = f'Login token: {get_token_from_file()} \n\n' \
                          f'Note: Use this token to authenticate at {get_config().get_public_app_url()}.\n' \
                          'The login token is saved inside the Docker container.'

    auth_documentation_link = 'https://docs.openvinotoolkit.org/latest/workbench_docs_Workbench_DG_Authentication.html'
    auth_disabled_message = 'You started the DL Workbench without authentication settings. To improve the security ' \
                            'of your experiments, start a new container with the command that enables ' \
                            f'authentication. See {auth_documentation_link} for details. '
    print(f'{login_token_message if ENABLE_AUTH else auth_disabled_message}\n\n')
