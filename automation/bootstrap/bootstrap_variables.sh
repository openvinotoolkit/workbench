#!/bin/bash

printf "\nSet Environment variables\n"

set -x

export OPENVINO_WORKBENCH_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export BOOTSTRAP_SCRIPTS_PATH=${OPENVINO_WORKBENCH_ROOT}/automation/bootstrap

set +x
