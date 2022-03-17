#!/bin/bash
# Copyright (c) 2021 Intel Corporation
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

RETRIES=10
TOKEN_PATH="${WORKBENCH_PUBLIC_DIR}/token.txt"
CONFIG_PATH="$(pwd)/docker/scripts/jupyter_notebook_config.py"

if [ -n "${DISABLE_JUPYTER}" ]; then
  exit 0;
fi

# Copy Jupyter tutorials to Workbench public artifacts directory if don't exist
if [ ! -d "${JUPYTER_TUTORIALS_DIR}" ]; then
  cp -r ${OPENVINO_WORKBENCH_ROOT}/tutorials ${JUPYTER_TUTORIALS_DIR}
  chown -R ${USER_NAME} ${JUPYTER_TUTORIALS_DIR}
  find ${JUPYTER_TUTORIALS_DIR} -type d -exec chmod 777 {} \;
fi

function wait_for_token() {
  retry=0
  while [[ ! -f "${TOKEN_PATH}" ]]; do
    ((retry++))
    if [[ "${retry}" -gt "${RETRIES}" ]]; then
      echo "Retry limit exceeded for Jupyter"
      exit 1
    fi
    echo "Waiting for login token to appear"
    sleep 3
  done
}

if [[ -z ${ENABLE_AUTH} ]]; then
  LOGIN_TOKEN=""

  echo "Authentication for Jupyter Lab is disabled."
else
  wait_for_token

  LOGIN_TOKEN="$(cat "${TOKEN_PATH}")"

  echo "Token for Jupyter Lab: ${LOGIN_TOKEN}"
fi

sed -i "s/<workbench_token>/${LOGIN_TOKEN}/g" "${CONFIG_PATH}"

cd "${WORKBENCH_PUBLIC_DIR}" || exit

# Set Accuracy Checker log level to default for notebook cells before starting JupyterLab
unset ACCURACY_CHECKER_LOG_LEVEL

source ${NOTEBOOKS_VENV}/bin/activate

jupyter lab --config "${CONFIG_PATH}" &>>"${WB_LOG_FILE}"
