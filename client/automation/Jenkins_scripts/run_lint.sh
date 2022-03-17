#!/bin/bash

set +ex
. ${NVM_DIR}/nvm.sh > /dev/null
set -ex
cd ${WORKBENCH_FE_DIR}
npm run lint
