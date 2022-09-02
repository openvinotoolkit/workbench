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

# DL Workbench docker entrypoint.
# Usage: `./entrypoint.package.sh`
#
# Supported environment variables:
#   - SSL_CERT - Path to DL Workbench web app TLS certificate in container
#   - SSL_KEY - Path to SSL_CERT certificate private key in container
#   - SSL_VERIFY - `off` if SSL_CERT TLS certificate is self-signed or
#       untrusted (default is `on` - TLS certificate is trusted)
#
# To configure DL Workbench to use SSL put SSL certificate and key to
# `~/.workbench` configuration folder and use `--volume` option of `docker run`
# to mount it into `/home/openvino`:
# `--volume ~/.workbench:/home/openvino/.workbench:ro`
#
# Example how to can generate self signed certificate with OpenSSL ans use
# it for DL Workbench:
#   mkdir -p ~/.workbench
#   openssl req -newkey rsa:4096 -nodes -keyout ~/.workbench/key.pem -x509 -days 365 -out ~/.workbench/certificate.pem
#   docker run \
#       --volume ~/.workbench:/home/openvino/.workbench:ro \
#       -e SSL_CERT=/home/openvino/.workbench/certificate.pem \
#       -e SSL_KEY=/home/openvino/.workbench/key.pem \
#       -p 127.0.0.1:5665:5665 -it openvino/workbench:latest

export WB_LOG_LEVEL=DEBUG
export WB_LOG_FILE=${WORKBENCH_PUBLIC_DIR}/server.log
export API_PORT=5666
export PROXY_PORT=5665
export JUPYTER_PORT=8888
export SSL_CERT=${SSL_CERT}
export SSL_KEY=${SSL_KEY}
export SSL_VERIFY=${SSL_VERIFY:-on}
export SERVER_MODE=production

# TODO: 59795 Skipping errors and warnings from python git wrapper which is the dependency of datumaro
export GIT_PYTHON_REFRESH=quiet

./docker/scripts/start_postgresql.sh || exit 1

./docker/scripts/start_rabbitmq.sh

./docker/scripts/start_nginx.sh

# TODO: rm LC_ALL & LANG when 53369 is resolved
LC_ALL=C.UTF-8 LANG=C.UTF-8 celery --quiet -A wb.main.tasks.task worker --loglevel=${WB_LOG_LEVEL} \
  -f ${WB_LOG_FILE} &

./docker/scripts/wait_until_db_is_live.sh

python3 ./docker/scripts/configure_index_html.py \
      --index-html-path ./static/index.html \
      --disable-analytics ${DISABLE_ANALYTICS} \
      --analytics-id ${GOOGLE_ANALYTICS_ID} \
      $([ -z ${BASE_PREFIX+x} ] || printf -- '--base-prefix %s' ${BASE_PREFIX} ) \
      || exit 1

./docker/scripts/start_jupyter.sh &

# TODO: rm LC_ALL & LANG when 53369 is resolved
LC_ALL=C.UTF-8 LANG=C.UTF-8 gunicorn \
  --limit-request-field_size 0 \
  --worker-class eventlet \
  -w 1 \
  -b 127.0.0.1:${API_PORT} workbench:APP \
    --log-level ${WB_LOG_LEVEL} \
    --log-file ${WB_LOG_FILE} \
    --error-logfile ${WB_LOG_FILE} \
    --enable-stdio-inheritance
