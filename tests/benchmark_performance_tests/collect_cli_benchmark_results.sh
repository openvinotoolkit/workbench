#!/bin/bash
echo 'Staring benchmark performance measurements...'

set -e

source "${INTEL_OPENVINO_DIR}/setupvars.sh"

BENCHMARK_PERFORMANCE_REPORTS_PATH=${OPENVINO_WORKBENCH_ROOT}/client/e2e/benchmark_performance_reports

BENCHMARK_PERFORMANCE_TESTS_PATH="${OPENVINO_WORKBENCH_ROOT}/tests/benchmark_performance_tests"

MODELS_LIST_FILE="${BENCHMARK_PERFORMANCE_TESTS_PATH}/models_list.txt"
PATH_TO_MODELS="${RESOURCES_PATH}models/IR/"
BENCHMARK_DATASETS_DIR="${WORKSPACE}/datasets"
OD_DATASET_PATH="${BENCHMARK_DATASETS_DIR}/VOCdevkit/VOC2007/JPEGImages"
CLASSIFICATION_DATASET_PATH="${BENCHMARK_DATASETS_DIR}/imagenet"

mkdir -p "${BENCHMARK_PERFORMANCE_REPORTS_PATH}" "${BENCHMARK_DATASETS_DIR}" "${CLASSIFICATION_DATASET_PATH}"

tar -xf "${RESOURCES_PATH}datasets/VOC_small.tar.gz" -C "${BENCHMARK_DATASETS_DIR}"
tar -xf "${RESOURCES_PATH}datasets/imagenet10.tar.gz" -C "${CLASSIFICATION_DATASET_PATH}"


MODELS_LIST=$(cat "${MODELS_LIST_FILE}")

for model_path in ${MODELS_LIST}
do
    model_name=$(basename -- "${model_path}")
    model_name="${model_name%.*}"

    if [[ ${model_path} == *'classification'* ]];
    then
      DATASET_PATH=${CLASSIFICATION_DATASET_PATH}
    else
      DATASET_PATH=${OD_DATASET_PATH}
    fi

    echo "Running inference for ${model_name} with dataset in path ${DATASET_PATH}"

    MODEL_XML_PATH=${PATH_TO_MODELS}${model_path}
    REPORT_FILE_PATH=${BENCHMARK_PERFORMANCE_REPORTS_PATH}/${model_name}.json

    pushd "${BENCHMARK_PERFORMANCE_TESTS_PATH}"
      python3 create_benchmark_performance_report.py --model-xml-path "${MODEL_XML_PATH}" --dataset-path "${DATASET_PATH}" --report-file-path "${REPORT_FILE_PATH}"
    popd

done
