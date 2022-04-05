#!/usr/bin/env bash

TEMP_FOLDER=/tmp/build_wb
HTTP_PROXY=${http_proxy}
HTTPS_PROXY=${https_proxy}
IMAGE_NAME=workbench
IMAGE_TAG=local
TERMINAL_COLOR_MESSAGE='\033[1;33m'
TERMINAL_COLOR_CLEAR='\033[0m'

while (( "$#" )); do
  case "$1" in
    --wheels-path)
      WHEELS_PATH=$2
      shift 2
      ;;
    --bundles-path)
      BUNDLES_PATH=$2
      shift 2
      ;;
    *)
      echo Unsupport argument $1
      exit 1
      ;;
  esac
done

set -e

echo
echo -e "${TERMINAL_COLOR_MESSAGE} The script must be run from the root folder of the Workbench ${TERMINAL_COLOR_CLEAR}"
echo

ROOT_FOLDER="${PWD}"
pushd ${ROOT_FOLDER}

  if [ -d $TEMP_FOLDER ]; then
    rm -rf $TEMP_FOLDER
  fi
  mkdir $TEMP_FOLDER
  pushd $TEMP_FOLDER
    rsync -av --progress ${ROOT_FOLDER} ./ --exclude={'venv','venv_tf2','tests','client','.git','wb/data','.venv','.unified_venv'}
    rsync -av --progress ${ROOT_FOLDER}/client ./ --exclude={'node_modules','.idea','.git','e2e'}

    VERSIONS_FILE="${ROOT_FOLDER}/automation/Jenkins/openvino_version.yml"

    OPENVINO_SETUP_VARS_LINK="https://raw.githubusercontent.com/openvinotoolkit/openvino/master/scripts/setupvars/setupvars.sh"
    curl -LO ${OPENVINO_SETUP_VARS_LINK}

    WHEELS_FOLDER="${TEMP_FOLDER}/workbench/wheels"
    mkdir ${WHEELS_FOLDER}
    if [[ ! -z ${WHEELS_PATH} ]]; then
      cp -R ${WHEELS_PATH}/* ${WHEELS_FOLDER}
    else
      WHEELS_VERSION=$(grep 'openvino_wheels_version'  ${VERSIONS_FILE} | awk '{print $2}')
      pushd ${WHEELS_FOLDER}
        pip download "openvino==${WHEELS_VERSION}" --pre -d . --no-deps --python-version 3.8
        pip download "openvino-dev==${WHEELS_VERSION}" --pre -d . --no-deps --python-version 3.8
      popd
    fi

    BUNDLES_FOLDER="${TEMP_FOLDER}/workbench/bundles"
    mkdir ${BUNDLES_FOLDER}
    if [[ ! -z ${BUNDLS_PATH} ]]; then
      cp -R ${BUNDLS_PATH}/* ${BUNDLES_FOLDER}
    else
      pushd ${BUNDLES_FOLDER}
        PACKAGE_LINK=$(grep 'openvino_deployment_archives'  ${VERSIONS_FILE} | awk '{print $2}')
        python3 "${TEMP_FOLDER}/workbench/wb/main/utils/bundle_creator/bundle_downloader.py" \
                --link "${PACKAGE_LINK}" \
                -os ubuntu18 ubuntu20 \
                --output-path "${BUNDLES_FOLDER}" \
                --targets cpu gpu hddl opencv python3.6 python3.7 python3.8 vpu
      popd
    fi

    cp ${ROOT_FOLDER}/docker/dockerfiles/Dockerfile_opensource_image.template Dockerfile

    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} . \
                  --no-cache \
                  --build-arg RABBITMQ_PASSWORD=openvino \
                  --build-arg DB_PASSWORD=openvino \
                  $([ -z ${no_proxy+x} ] || printf -- "--build-arg NO_PROXY=${no_proxy}") \
                  $([ -z ${http_proxy+x} ] || printf -- "--build-arg HTTP_PROXY=${http_proxy}") \
                  $([ -z ${https_proxy+x} ] || printf -- "--build-arg HTTPS_PROXY=${https_proxy}")
  popd

popd

echo "To run the image, execute the following command:"
echo "docker rm local_build || true && openvino-workbench --image ${IMAGE_NAME}:${IMAGE_TAG} --container-name local_build --enable-gpu"
