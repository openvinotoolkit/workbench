#!/bin/bash
set -e

cd ${OPENVINO_WORKBENCH_ROOT}

source .venv/bin/activate

export WB_LOG_LEVEL=DEBUG
export WB_LOG_FILE=${OPENVINO_WORKBENCH_ROOT}/server.log
export API_PORT=5676
export PROXY_PORT=80
export PYTHONPATH=${OPENVINO_WORKBENCH_ROOT}:${OPENVINO_WORKBENCH_ROOT}/model_analyzer:${PYTHONPATH}

sleep 20

export RABBITMQ_HOST=$(getent hosts rabbitmq | awk '{ print $1 }')

LC_ALL=C.UTF-8 LANG=C.UTF-8 FLASK_APP=migrations/migration:APP flask db upgrade

LC_ALL=C.UTF-8 LANG=C.UTF-8 celery -A wb.main.tasks.task worker --loglevel=${WB_LOG_LEVEL} -f ${WB_LOG_FILE} &

LC_ALL=C.UTF-8 LANG=C.UTF-8 gunicorn --worker-class eventlet -w 1 -b 0.0.0.0:${API_PORT} workbench:APP \
      --log-level ${WB_LOG_LEVEL} \
      --log-file ${WB_LOG_FILE} \
      --error-logfile ${WB_LOG_FILE} \
      --capture-output \
      --enable-stdio-inheritance
