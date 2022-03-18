#!/bin/bash

set +ex
. ${NVM_DIR}/nvm.sh > /dev/null
set -ex

cd ${WORKBENCH_FE_DIR}

python3.8 -m unittest npm_audit_test.py
