#!/bin/bash
# Copyright (c) 2018-2019 Intel Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

nginx_config=${OPENVINO_WORKBENCH_ROOT}/nginx/dl-workbench-ssl.com
nginx_security_config=${OPENVINO_WORKBENCH_ROOT}/nginx/security-ssl.conf

if [[ -z "$SSL_CERT" ]] && [[ -z "$SSL_KEY" ]]; then
  nginx_config=${OPENVINO_WORKBENCH_ROOT}/nginx/dl-workbench.com
  nginx_security_config=${OPENVINO_WORKBENCH_ROOT}/nginx/security.conf
fi

envsubst '\$PROXY_PORT \$API_PORT \$JUPYTER_PORT \${OPENVINO_WORKBENCH_DATA_PATH} \${OPENVINO_WORKBENCH_ROOT} \${SSL_CERT} \${SSL_KEY} \${SSL_VERIFY}' <${nginx_config} >/etc/nginx/sites-enabled/dl-workbench.com
envsubst '\${PROXY_PORT}' <${nginx_security_config} >/etc/nginx/snippets/security.conf

/etc/init.d/nginx start
