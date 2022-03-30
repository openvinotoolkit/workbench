#!/bin/bash

set -e

OPENVINO_FOLDER="${HOME}/intel/openvino_2022/"
OPENVINO_LIB_LINK="https://storage.openvinotoolkit.org/repositories/openvino/packages/2022.1/l_openvino_toolkit_runtime_ubuntu20_p_2022.1.0.643.tgz"

mkdir -p -m 777 ${OPENVINO_FOLDER}

pushd ${OPENVINO_FOLDER}
    curl -LO ${OPENVINO_LIB_LINK}
    LIB_FOLDER=$(basename ${OPENVINO_LIB_LINK})
    tar -xvf ${LIB_FOLDER} --strip-components=2
popd
