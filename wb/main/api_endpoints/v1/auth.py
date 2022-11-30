"""
 OpenVINO DL Workbench
 Authentication Endpoints

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
from functools import wraps
from typing import Callable

from flask import jsonify, request, Response
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, set_refresh_cookies, \
    jwt_required, unset_jwt_cookies, get_jwt, get_jti

from config.constants import ENABLE_AUTH
from wb.extensions_factories.database import get_db_session_for_app
from wb.extensions_factories.jwt import BLACKLIST, get_jwt
from wb.main.api_endpoints.v1 import V1_AUTH_API
from wb.error.code_registry import JWTAuthStatusCodeEnum
from wb.main.models.users_model import UsersModel
from wb.main.utils.safe_runner import safe_run
from wb.utils.utils import update_url_token

JWT_MANAGER = get_jwt()


def check_auth_enabled(func: Callable) -> Callable:
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not ENABLE_AUTH:
            user_record: UsersModel = UsersModel.query.first()
            response = create_response_with_tokens(user_data=user_record.json())
            return response, 200
        return func(*args, **kwargs)

    return wrapper


# pylint: disable=too-many-return-statements
@V1_AUTH_API.route('/auth/login', methods=['POST'])
@safe_run
def handle_login_with_token():
    if not request.is_json:
        return jsonify({'message': 'Missing JSON in request'}), 400

    username = request.json.get('username', None)
    if not username:
        return jsonify({'message': 'Missing username'}), 400

    token = request.json.get('token', None)
    if not token:
        return jsonify({'message': 'Missing login token'}), 400

    user_record: UsersModel = UsersModel.query.filter_by(username=username).first()
    if not user_record:
        return jsonify({'message': 'No default user found'}), 404

    if request.json.get('isUrlLogin', None):
        if not user_record.is_correct_url_token(token):
            return jsonify({'message': 'Incorrect URL token'}), 401
        update_url_token(get_db_session_for_app(), is_regenerated=True)

    else:
        if not user_record.is_correct_login_token(token):
            return jsonify({'message': 'Incorrect token'}), 401

    response = create_response_with_tokens(user_data=user_record.json())
    return response, 200


@V1_AUTH_API.route('/auth/refresh', methods=['POST'])
@check_auth_enabled
@jwt_required(refresh=True)
@safe_run
def handle_refresh_token():
    refresh_token_jti = get_jwt().get('jti')
    BLACKLIST.add(refresh_token_jti)
    user_identity = get_jwt_identity()
    response = create_response_with_tokens(user_data=user_identity)
    return response, 200


@V1_AUTH_API.route('/auth/logout', methods=['DELETE'])
@jwt_required()
@safe_run
def handle_logout():
    access_token_jti = get_jwt().get('jti')
    BLACKLIST.add(access_token_jti)
    refresh_token = request.cookies.get('refresh_token_cookie')
    if refresh_token:
        BLACKLIST.add(get_jti(refresh_token))
    response = jsonify({'logout': True})
    unset_jwt_cookies(response)
    return response, 200


@V1_AUTH_API.route('/auth', methods=['GET'])
@jwt_required()
@safe_run
def handle_check_auth():
    return '', 200


@JWT_MANAGER.token_in_blocklist_loader
def check_if_token_in_blacklist(unused_jwt_header, decrypted_token: dict):
    jti = decrypted_token.get('jti')
    return jti in BLACKLIST


@JWT_MANAGER.unauthorized_loader
def add_auth_status_on_missing_jwt(error_message):
    return jsonify({
        'authStatus': JWTAuthStatusCodeEnum.MISSING_JWT.value,
        'message': error_message
    }), 401


@JWT_MANAGER.invalid_token_loader
def add_auth_status_on_invalid_jwt(error_message):
    response = jsonify({
        'authStatus': JWTAuthStatusCodeEnum.INVALID_JWT.value,
        'message': error_message
    })
    unset_jwt_cookies(response)
    return response, 422


@JWT_MANAGER.revoked_token_loader
def add_auth_status_on_revoked_jwt(unused_jwt_headers, jwt_payload):
    response = jsonify({
        'authStatus': JWTAuthStatusCodeEnum.INVALID_JWT.value,
        'message': 'Token has been revoked'
    })
    unset_jwt_cookies(response)
    return response, 422


@JWT_MANAGER.expired_token_loader
def add_auth_status_on_expired_jwt(unused_jwt_header, expired_token):
    response_dict = {
        'message': 'Token has expired'
    }
    if expired_token['type'] == 'access':
        response_dict['authStatus'] = JWTAuthStatusCodeEnum.EXPIRED_ACCESS_JWT.value
        response = jsonify(response_dict)
    else:
        response_dict['authStatus'] = JWTAuthStatusCodeEnum.EXPIRED_REFRESH_JWT.value
        response = jsonify(response_dict)
        unset_jwt_cookies(response)
    return response, 401


def create_response_with_tokens(user_data: dict) -> Response:
    access_token = create_access_token(identity=user_data)
    response = jsonify({
        'accessToken': access_token
    })
    refresh_token = create_refresh_token(identity=user_data)
    set_refresh_cookies(response, refresh_token)
    return response
