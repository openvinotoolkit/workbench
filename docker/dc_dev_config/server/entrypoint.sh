#!/bin/bash

set -e

export TOKEN_PATH="${OPENVINO_WORKBENCH_DATA_PATH}/users/token.txt"
export PYTHONPATH=$PYTHONPATH:$SERVER_ROOT

function find_token() {
  while [[ ! -f $TOKEN_PATH ]]; do
    echo "[*] Token file not created yet, waiting..."
    sleep 3
  done

  echo "Your access token is $(cat "$TOKEN_PATH")"
}

echo "[*] Sourcing setupvars.sh..."
# shellcheck disable=SC1090
# source "${INTEL_OPENVINO_DIR}/setupvars.sh"

cd "${SERVER_ROOT}"

case ${CONTAINER_TYPE} in
"web")
  echo "[*] Running migrations..."
  LC_ALL=C.UTF-8 LANG=C.UTF-8 FLASK_APP=migrations/migration:APP flask db upgrade

  find_token &

  echo "[*] Starting gunicorn..."
  SERVER_MODE=production gunicorn workbench:APP \
    --reload \
    --worker-class eventlet \
    -w 1 -b 0.0.0.0:8000 \
    --log-level DEBUG
  ;;

"celery")
  echo "[*] Starting celery..."
  # not really effective due to polling of all source code
  # no other way found to work with osxfs
  watchmedo auto-restart --debug-force-polling --directory=./ --patterns '*.py' --recursive -- \
    celery -A wb.main.tasks.task worker --loglevel=DEBUG
  ;;
esac
