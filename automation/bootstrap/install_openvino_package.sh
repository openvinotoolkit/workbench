#!/bin/bash

set -e

OPENVINO_FOLDER="${HOME}/intel/openvino_2022/"
OPENVINO_PACKAGE_URL="https://storage.openvinotoolkit.org/repositories/openvino/packages"
if [[ "$OSTYPE" == "darwin"* ]]; then
  PACKAGE_TYPE='openvino_runtime_package_darwin'
else
  PACKAGE_TYPE='openvino_runtime_package_ubuntu'
fi
PACKAGE=$(grep ${PACKAGE_TYPE} ${OPENVINO_WORKBENCH_ROOT}/automation/Jenkins/openvino_version.yml | awk '{print $2}')
OPENVINO_LIB_LINK="${OPENVINO_PACKAGE_URL}/${PACKAGE}"

mkdir -p -m 777 ${OPENVINO_FOLDER}

pushd ${OPENVINO_FOLDER}
    curl -LO ${OPENVINO_LIB_LINK}
    LIB_FOLDER=$(basename ${OPENVINO_LIB_LINK})
    tar -xvf ${LIB_FOLDER} --strip-components=2
popd
