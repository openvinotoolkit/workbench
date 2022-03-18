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

function check_database() {
  psql "postgresql://${DB_USER}:${DB_PASSWORD}@localhost/${DB_NAME}" --command "SELECT version FROM wb_info" >/dev/null
  result_db=$?
}

function check_celery() {
  LC_ALL=C.UTF-8 LANG=C.UTF-8 celery -A wb.main.tasks.task status &> ${WB_LOG_FILE}
  result_celery=$?
}

check_database

while [[ ${result_db} -ne 0 ]]; do
  echo "Database is not ready at the moment. Retry in 2 seconds"
  check_database
  sleep 2
done

check_celery

while [[ ${result_celery} -ne 0 ]]; do
  echo "Celery is not ready at the moment. Retry in 2 seconds"
  check_celery
  sleep 2
done

echo "[Workbench] Celery ready for start up"
