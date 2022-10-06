#!/usr/bin/env bash

TEMP_FOLDER=${TEMP_FOLDER:='/tmp/build_wb'}
HTTP_PROXY=${http_proxy}
HTTPS_PROXY=${https_proxy}

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
    --image-name)
      IMAGE_NAME=$2
      shift 2
      ;;
    --image-tag)
      IMAGE_TAG=$2
      shift 2
      ;;
    *)
      echo Unsupport argument $1
      exit 1
      ;;
  esac
done

if [[ -z ${IMAGE_NAME} ]]; then
    IMAGE_NAME=workbench
fi

if [[ -z ${IMAGE_TAG} ]]; then
    IMAGE_TAG=local
fi

set -e

echo -e "${TERMINAL_COLOR_MESSAGE} The script must be run from the root folder of the Workbench ${TERMINAL_COLOR_CLEAR}"
echo -e "${TERMINAL_COLOR_MESSAGE} Also install 'NVM' from the repository 'https://github.com/nvm-sh/nvm' and install the client dependencies in the client folder with the following command: 'npm install'${TERMINAL_COLOR_CLEAR}"
echo

ROOT_FOLDER="${PWD}"
pushd ${ROOT_FOLDER}

  pushd client
    source ${NVM_DIR}/nvm.sh && nvm use 14
    DL_PROFILER_BACKEND_STATIC_PATH=../static/ npm run pack
  popd

  if [ -d $TEMP_FOLDER ]; then
    rm -rf $TEMP_FOLDER
  fi
  mkdir $TEMP_FOLDER
  pushd $TEMP_FOLDER
    rsync -av --progress ${ROOT_FOLDER} ./ --exclude={'venv','venv_tf2','tests','client','.git','wb/data','.venv','.unified_venv'}

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
    if [[ ! -z ${BUNDLES_PATH} ]]; then
      cp -R ${BUNDLES_PATH}/* ${BUNDLES_FOLDER}
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
                  $([ -z ${GOOGLE_ANALYTICS_ID+x} ] || printf -- "--build-arg GOOGLE_ANALYTICS_ID=${GOOGLE_ANALYTICS_ID}") \
                  $([ -z ${no_proxy+x} ] || printf -- "--build-arg NO_PROXY=${no_proxy}") \
                  $([ -z ${http_proxy+x} ] || printf -- "--build-arg HTTP_PROXY=${http_proxy}") \
                  $([ -z ${https_proxy+x} ] || printf -- "--build-arg HTTPS_PROXY=${https_proxy}")
  popd

popd

echo "To run the image, execute the following command:"
echo "docker rm local_build || true && openvino-workbench --image ${IMAGE_NAME}:${IMAGE_TAG} --container-name local_build"
