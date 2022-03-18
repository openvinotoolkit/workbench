#!/bin/bash
# Copyright (c) 2018-2021 Intel Corporation
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

POSTGRESQL_BIN_PATH=/usr/lib/postgresql/10/bin

setup_env() {
  declare -g DATABASE_ALREADY_EXISTS
  if [ -d "${WORKBENCH_POSTGRESQL_DATA_DIR}" ] && [ -s "${WORKBENCH_POSTGRESQL_DATA_DIR}/PG_VERSION" ]; then
    DATABASE_ALREADY_EXISTS="true"
  fi
}

setup_db() {
  if [ -z "${DATABASE_ALREADY_EXISTS}" ]; then
    # TODO: rm -E UTF8 when 53369 is resolved
    ${POSTGRESQL_BIN_PATH}/initdb -E UTF8 -D "${WORKBENCH_POSTGRESQL_DATA_DIR}" &> ${WB_LOG_FILE}
    ${POSTGRESQL_BIN_PATH}/pg_ctl -D "${WORKBENCH_POSTGRESQL_DATA_DIR}" -w start --log=${WB_LOG_FILE}
    psql -d postgres --command "CREATE USER ${DB_USER} WITH SUPERUSER PASSWORD '${DB_PASSWORD}'" --quiet &> ${WB_LOG_FILE}
    createdb -O "${DB_USER}" "${DB_NAME}"
    psql -d postgres --command "ALTER USER ${DB_USER} PASSWORD '${DB_PASSWORD}'" --quiet

    ${POSTGRESQL_BIN_PATH}/pg_ctl -D "${WORKBENCH_POSTGRESQL_DATA_DIR}" -w stop --log=${WB_LOG_FILE}

    sed -i "s/trust/md5/g" "${WORKBENCH_POSTGRESQL_DATA_DIR}/pg_hba.conf"

    echo
    echo "[Workbench] PostgreSQL init process complete."
    echo
  else
    echo
    echo "[Workbench] PostgreSQL data directory appears to contain a database. Skipping initialization."
    echo
  fi
}

apply_migrations() {
  echo
  echo "[Workbench] PostgreSQL applying migrations..."
  echo

  ${POSTGRESQL_BIN_PATH}/pg_ctl -D "${WORKBENCH_POSTGRESQL_DATA_DIR}" -w start --log=${WB_LOG_FILE}

  if ! LC_ALL=C.UTF-8 LANG=C.UTF-8 FLASK_APP=migrations/migration:APP flask db upgrade; then
    echo "[UPGRADE DL WORKBENCH ERROR]"
    echo "Unable to upgrade the DL Workbench. Run the highest DL Workbench version without your data or use the previous DL Workbench version to keep your data in the tool. \
    See documentation for details: https://docs.openvinotoolkit.org/latest/workbench_docs_Workbench_DG_Troubleshooting.html#failed-to-upgrade"
    ${POSTGRESQL_BIN_PATH}/pg_ctl -D "${WORKBENCH_POSTGRESQL_DATA_DIR}" -w stop --log=${WB_LOG_FILE}
    exit 1
  fi

  ${POSTGRESQL_BIN_PATH}/pg_ctl -D "${WORKBENCH_POSTGRESQL_DATA_DIR}" -w stop --log=${WB_LOG_FILE}

  echo
  echo "[Workbench] PostgreSQL ready for start up."
  echo
}

setup_env

setup_db

apply_migrations

# TODO: 69771
${POSTGRESQL_BIN_PATH}/postgres -c max_connections=300 -c shared_buffers=512MB -D "${WORKBENCH_POSTGRESQL_DATA_DIR}" &> ${WB_LOG_FILE} &
