#!/bin/bash

export TOKEN_PATH=${WORKSPACE}/users/token.txt

while (( "$#" )); do
  case "$1" in
    -d|--deployment_manager_path)
      DEPLOYMENT_MANAGER_PATH=$2
      shift 2
      ;;
    -h|--hostname)
      HOSTNAME=$2
      shift 2
      ;;
    -p|--port)
      PORT=$2
      shift 2
      ;;
    -i|--ubuntu_image)
      UBUNTU_IMAGE=$2
      shift 2
      ;;
    -os)
      OS=$2
      shift 2
      ;;
    *)
      echo Unsupport argument $1
      exit 1
      ;;
  esac
done

set -e

python3 ${OPENVINO_WORKBENCH_ROOT}/tests/deployment_tests/scripts/get_bundle.py --token ${TOKEN_PATH} --hostname http://${HOSTNAME}:${PORT} --tls 1 --path ${OPENVINO_WORKBENCH_ROOT}/tests/deployment_tests/scripts --os ${OS}

mkdir -m 777 ${DEPLOYMENT_MANAGER_PATH} \
             ${DEPLOYMENT_MANAGER_PATH}/packages \
             ${DEPLOYMENT_MANAGER_PATH}/scripts \
             ${DEPLOYMENT_MANAGER_PATH}/model \
             ${OPENVINO_WORKBENCH_ROOT}/tests/deployment_tests/ie_sample/build

cp ${OPENVINO_WORKBENCH_ROOT}/tests/deployment_tests/scripts/bundle.tar.gz ${DEPLOYMENT_MANAGER_PATH}/packages
tar -xf ${OPENVINO_WORKBENCH_ROOT}/tests/deployment_tests/scripts/bundle.tar.gz -C ${DEPLOYMENT_MANAGER_PATH}/packages

cp ${OPENVINO_WORKBENCH_ROOT}/tests/deployment_tests/scripts/* ${DEPLOYMENT_MANAGER_PATH}/scripts
cp ${OPENVINO_WORKBENCH_ROOT}/tests/deployment_tests/Dockerfile ${DEPLOYMENT_MANAGER_PATH}
sed -i "s|BASE_IMAGE_UBUNTU|${UBUNTU_IMAGE}|g" ${DEPLOYMENT_MANAGER_PATH}/Dockerfile
cp ${RESOURCES_PATH}/models/IR/classification/squeezenetV1.1/*.* ${DEPLOYMENT_MANAGER_PATH}/model
cd ${OPENVINO_WORKBENCH_ROOT}/tests/deployment_tests/ie_sample/build

source ${DEPLOYMENT_MANAGER_PATH}/packages/setupvars.sh

cmake ..
make
cp ie_sample ${DEPLOYMENT_MANAGER_PATH}/scripts
