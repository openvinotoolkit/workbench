#!/bin/bash

# Check that script is executed from DL Workbench root directory
if [ "$(basename "$(pwd)")" != "workbench" ]; then
  echo 'Benchmark performance collecting script should be run from DL Workbench root directory'
  exit 1
fi

# TODO Set up path to directory with resources (models + datasets)
export RESOURCES_PATH=""

OPENVINO_WORKBENCH_ROOT=$(pwd)

IMAGE_NAME=wb_performance
IMAGE_TAG=gif_spinner

IMAGE_NAME_WITH_TAG="${IMAGE_NAME}:${IMAGE_TAG}"

MOUNTED_DIR=".wb_docker"

PERFORMANCE_REPORTS_DIR="wb_performance_reports"

MOUNTED_PATH="${OPENVINO_WORKBENCH_ROOT}/${MOUNTED_DIR}"
MOUNTED_RESOURCES_PATH="${MOUNTED_PATH}/resources"
LOCAL_REPORTS_PATH="${MOUNTED_PATH}/${PERFORMANCE_REPORTS_DIR}"



# Create required directories in mounted directory
echo "Creating directories for performance test"
mkdir -p "${MOUNTED_PATH}" "${MOUNTED_RESOURCES_PATH}" "${LOCAL_REPORTS_PATH}"

# Copy resources to mounted path
echo "Copying resources to directory that will be mounted to Docker container"
cp -a "${RESOURCES_PATH}/." "${MOUNTED_RESOURCES_PATH}"

_BENCHMARK_PERFORMANCE_TESTS_PATH="${OPENVINO_WORKBENCH_ROOT}/tests/benchmark_performance_tests"

# Copy benchmark performance tests to mounted directory
echo "Copying benchmark performance scripts to directory that will be mounted to Docker container"
cp -a "${_BENCHMARK_PERFORMANCE_TESTS_PATH}/." "${LOCAL_REPORTS_PATH}"

_DOCKER_WB_PUBLIC_PATH="/home/workbench/.workbench"

#echo "Running Docker container"
CONTAINER_ID=$(docker run -p 0.0.0.0:5665:5665 --name ${IMAGE_TAG} -d --volume "${MOUNTED_PATH}:${_DOCKER_WB_PUBLIC_PATH}" ${IMAGE_NAME_WITH_TAG})

echo "Container Id: ${CONTAINER_ID}"

# Wait for container to start
echo "Waiting for container to start"
sleep 30
echo "Container is started"

# Run collecting benchmark performance inside docker
echo "Running collect CLI benchmark performance script inside Docker container"

DOCKER_WB_ROOT="/opt/intel/openvino/tools/workbench"
DOCKER_RESOURCES_PATH="${_DOCKER_WB_PUBLIC_PATH}/resources/"
DOCKER_WORKSPACE=${_DOCKER_WB_PUBLIC_PATH}
docker exec \
  -e RESOURCES_PATH="${DOCKER_RESOURCES_PATH}" \
  -e WORKSPACE="${DOCKER_WORKSPACE}" \
  "${CONTAINER_ID}" \
  bash -c "cd ${_DOCKER_WB_PUBLIC_PATH}/${PERFORMANCE_REPORTS_DIR} ; mkdir -p ${DOCKER_WB_ROOT}/tests/benchmark_performance_tests && cp models_list.txt \$_/models_list.txt ; ./collect_cli_benchmark_results.sh" || exit 1

# Copy report from docker to local reports path
echo "Copying benchmark performance report in Docker container to mounter directory"
docker cp "${CONTAINER_ID}:${DOCKER_WB_ROOT}/client/e2e/benchmark_performance_reports/." "${LOCAL_REPORTS_PATH}" || exit 1



# Run collecting benchmark performance with e2e
echo "Running benchmark performance e2e tests for collecting UI performance"
export TOKEN_FILE_PATH="${MOUNTED_PATH}/token.txt"
export BENCHMARK_PERFORMANCE_REPORTS_PATH="${LOCAL_REPORTS_PATH}"

export DISABLE_HEADLESS=1
export TARGET_BROWSER="chrome"
export SCOPE="e2e:performance"
export DL_PROFILER_DEPLOY_TARGET="http://localhost:5665"

pushd "${OPENVINO_WORKBENCH_ROOT}/client" || exit 1

  npx ng e2e --base-url ${DL_PROFILER_DEPLOY_TARGET} --dev-server-target= --webdriver-update false --suite performanceSuite

popd || exit 1

echo "Performance test with Docker is finished"
