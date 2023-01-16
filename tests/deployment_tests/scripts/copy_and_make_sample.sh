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

OV_PACKAGE_DIR="/tmp/openvino_package"

curl ${PACKAGE_LINK} -o /tmp/package.tgz \
                        && mkdir -p ${OV_PACKAGE_DIR} \
                        && tar -xzf /tmp/package.tgz -C ${OV_PACKAGE_DIR} \
                        && rm -rf /tmp/package.tgz \
                        && DIRNAME=$(ls ${OV_PACKAGE_DIR}/) && mv -v ${OV_PACKAGE_DIR}/${DIRNAME}/* ${OV_PACKAGE_DIR}

source "${OV_PACKAGE_DIR}/setupvars.sh"

set -e

python3 ${OPENVINO_WORKBENCH_ROOT}/tests/deployment_tests/scripts/get_bundle.py --token ${TOKEN_PATH} --hostname http://${HOSTNAME}:${PORT} --tls 1 --path ${OPENVINO_WORKBENCH_ROOT}/tests/deployment_tests/scripts --os ${OS}

mkdir -m 777 ${DEPLOYMENT_MANAGER_PATH} \
             ${DEPLOYMENT_MANAGER_PATH}/packages \
             ${DEPLOYMENT_MANAGER_PATH}/scripts \
             ${DEPLOYMENT_MANAGER_PATH}/model \
             ${OPENVINO_WORKBENCH_ROOT}/tests/deployment_tests/ie_sample/build

cp ${OPENVINO_WORKBENCH_ROOT}/tests/deployment_tests/scripts/bundle.tar.gz ${DEPLOYMENT_MANAGER_PATH}/packages
tar -xf ${OPENVINO_WORKBENCH_ROOT}/tests/deployment_tests/scripts/bundle.tar.gz -C ${DEPLOYMENT_MANAGER_PATH}/packages

# Get OpenVINO from package
rm -rf ${DEPLOYMENT_MANAGER_PATH}/packages/python && cp -r ${OV_PACKAGE_DIR}/python ${DEPLOYMENT_MANAGER_PATH}/packages
rm -rf ${DEPLOYMENT_MANAGER_PATH}/packages/runtime && cp -r ${OV_PACKAGE_DIR}/runtime ${DEPLOYMENT_MANAGER_PATH}/packages
rm -rf ${DEPLOYMENT_MANAGER_PATH}/packages/install_dependencies && cp -r ${OV_PACKAGE_DIR}/install_dependencies ${DEPLOYMENT_MANAGER_PATH}/packages

cp ${OPENVINO_WORKBENCH_ROOT}/tests/deployment_tests/scripts/* ${DEPLOYMENT_MANAGER_PATH}/scripts
cp ${OPENVINO_WORKBENCH_ROOT}/tests/deployment_tests/Dockerfile ${DEPLOYMENT_MANAGER_PATH}
sed -i "s|BASE_IMAGE_UBUNTU|${UBUNTU_IMAGE}|g" ${DEPLOYMENT_MANAGER_PATH}/Dockerfile
cp ${RESOURCES_PATH}/models/IR/classification/squeezenetV1.1/*.* ${DEPLOYMENT_MANAGER_PATH}/model
cd ${OPENVINO_WORKBENCH_ROOT}/tests/deployment_tests/ie_sample/build
cmake ..
make
cp ie_sample ${DEPLOYMENT_MANAGER_PATH}/scripts
