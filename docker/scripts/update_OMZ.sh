#!/bin/bash

WORK_DIR="/tmp/omz"
OMZ_PATH="openvino_2022/extras"

while (( "$#" )); do
  case "$1" in
    --omz-hash)
      OMZ_COMMIT_HASH=$2
      shift 2
      ;;
    --image)
      IMAGE=$2
      shift 2
      ;;
    *)
      echo Unsupport argument $1
      exit 1
      ;;
  esac
done

set -e

PACKAGE_RELEASE=$(echo ${IMAGE} | grep -oP ":20\K2\d(?=.*$)")

if [[ ${PACKAGE_RELEASE} == "21" ]]; then
  OMZ_PATH="openvino_2021/extras"
fi

pushd ${WORK_DIR}

  curl -L  https://github.com/openvinotoolkit/open_model_zoo/archive/${OMZ_COMMIT_HASH}.tar.gz --output omz.tar.gz && \
  tar xfz omz.tar.gz && \
  rm -rf /opt/intel/${OMZ_PATH}/open_model_zoo/* && \
  cp -r open_model_zoo-${OMZ_COMMIT_HASH}/* /opt/intel/${OMZ_PATH}/open_model_zoo/ && \
  cd /opt/intel/${OMZ_PATH}/open_model_zoo/tools/accuracy_checker/ && \
  python3 -m pip install . && \
  cd ../model_tools/ && \
  python3 -m pip install -r requirements.in

popd
