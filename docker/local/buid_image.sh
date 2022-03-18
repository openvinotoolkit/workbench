#!/usr/bin/env bash

TEMP_FOLDER=/tmp/build_wb
PATH_TO_WB_REPO=$(pwd)
HTTP_PROXY=${http_proxy}
HTTPS_PROXY=${https_proxy}
IMAGE_NAME=workbench
IMAGE_TAG=local
OPENVINO_VERSION="automation/Jenkins/openvino_version.yml"

while (( "$#" )); do
  case "$1" in
    --wb-path)
      PATH_TO_WB_REPO=$2
      shift 2
      ;;
    --base-image)
      BASE_IMAGE=$2
      shift 2
      ;;
    --wheels-path)
      WHEELS_PATH=$2
      shift 2
      ;;
    --bundles-path)
      BUNDLES_PATH=$2
      shift 2
      ;;
    --http-proxy)
      HTTP_PROXY=$2
      shift 2
      ;;
    --https-proxy)
      HTTPS_PROXY=$2
      shift 2
      ;;
    *)
      echo Unsupport argument $1
      exit 1
      ;;
  esac
done

set -e

FOLDER=$(basename $PATH_TO_WB_REPO)
if [ $FOLDER != "workbench" ]; then
  echo "Run script from workbench folder"
  exit 1
fi

pushd ${PATH_TO_WB_REPO}

  pushd client
    source ${NVM_DIR}/nvm.sh && nvm use 14
    DL_PROFILER_BACKEND_STATIC_PATH=../static/ npm run pack
  popd

  if [ -d $TEMP_FOLDER ]; then
    rm -rf $TEMP_FOLDER
  fi
  mkdir $TEMP_FOLDER
  pushd $TEMP_FOLDER
    rsync -av --progress ${PATH_TO_WB_REPO} ./ --exclude={'venv','venv_tf2','tests','client','.git','wb/data','.venv','.unified_venv'}

    VERSIONS_FILE="${PATH_TO_WB_REPO}/automation/Jenkins/openvino_version.yml"

    WHEELS_FOLDER="${TEMP_FOLDER}/workbench/wheels"
    mkdir ${WHEELS_FOLDER}
    if [[ ! -z ${WHEELS_PATH} ]]; then
      cp -R ${WHEELS_PATH}/* ${WHEELS_FOLDER}
    else
      WHEELS_VERSION=$(grep 'openvino_wheels_version'  ${VERSIONS_FILE} | awk '{print $2}')
      pushd ${WHEELS_FOLDER}
        pip download "openvino==${WHEELS_VERSION}" --pre -d . --no-deps
        pip download "openvino-dev==${WHEELS_VERSION}" --pre -d . --no-deps
      popd
    fi

    BUNDLES_FOLDER="${TEMP_FOLDER}/workbench/bundles"
    mkdir ${BUNDLES_FOLDER}
    if [[ ! -z ${BUNDLS_PATH} ]]; then
      cp -R ${BUNDLS_PATH}/* ${BUNDLES_FOLDER}
    else
      pushd ${BUNDLES_FOLDER}
        PACKAGE_LINK=$(grep 'openvino_package'  ${VERSIONS_FILE} | awk '{print $2}')
        python3 "${TEMP_FOLDER}/workbench/wb/main/utils/bundle_creator/bundle_downloader.py" \
                --link "${PACKAGE_LINK}" \
                -os ubuntu18 ubuntu20 \
                --output-path "${BUNDLES_FOLDER}" \
                --targets cpu gpu hddl opencv python3.6 python3.7 python3.8 vpu
      popd
    fi

    cp ${PATH_TO_WB_REPO}/docker/dockerfiles/Dockerfile_opensource_image.template Dockerfile
    sed -i -E "s|FROM .*$|FROM ${BASE_IMAGE}|g" Dockerfile
    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} . \
                  --no-cache \
                  --build-arg https_proxy=${HTTP_PROXY} \
                  --build-arg http_proxy=${HTTPS_PROXY} \
                  --build-arg no_proxy=localhost,127.0.0.1,intel.com,.intel.com \
                  --build-arg rabbitmq_password=openvino \
                  --build-arg db_password=openvino
  popd

popd

echo "For run image execute command:"
echo "docker rm local_build || true && openvino-workbench --image ${IMAGE_NAME}:${IMAGE_TAG} --container-name local_build"
