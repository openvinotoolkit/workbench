#!/bin/bash

set -xe

printf "\n Installing virtualenv \n\n"

python3 -m pip install --user virtualenv
export PYTHON_ENVIRONMENT_PATH=${OPENVINO_WORKBENCH_ROOT}/.venv

python3 -m virtualenv ${PYTHON_ENVIRONMENT_PATH}

source ${PYTHON_ENVIRONMENT_PATH}/bin/activate
source ~/intel/openvino_2022/setupvars.sh
pip install --upgrade pip==19.3.1
pip install -r ${OPENVINO_WORKBENCH_ROOT}/requirements/requirements_bootstrap.txt

export ARCHFLAGS="-arch x86_64"

printf "\n Installing accuracy checker \n\n"
pushd ${INTEL_OPENVINO_DIR}/extras/open_model_zoo/tools/accuracy_checker/
    python setup.py install
popd

printf "\n Installing Post Training Optimization Toolkit \n\n"
pushd ${INTEL_OPENVINO_DIR}/tools/post_training_optimization_tool
    python setup.py install
popd

printf "\n Installing Benchmark Tool and Model Analyzer \n\n"
python -m pip install -r ${INTEL_OPENVINO_DIR}/python/python3.6/requirements.txt
python -m pip install -r ${INTEL_OPENVINO_DIR}/tools/benchmark_tool/requirements.txt
python -m pip install -r ${OPENVINO_WORKBENCH_ROOT}/requirements/requirements.txt
python -m pip install -r ${OPENVINO_WORKBENCH_ROOT}/requirements/requirements_dev.txt
python -m pip install -r ${OPENVINO_WORKBENCH_ROOT}/requirements/requirements_jupyter.txt
python -m pip install -r ${OPENVINO_WORKBENCH_ROOT}/client/automation/requirements_dev.txt
python -m pip install -r ${OPENVINO_WORKBENCH_ROOT}/model_analyzer/requirements.txt
deactivate

printf "\n Installing dependecies of deep learning frameworks \n\n"

python3 -m virtualenv ${OPENVINO_WORKBENCH_ROOT}/.unified_venv
source ${OPENVINO_WORKBENCH_ROOT}/.unified_venv/bin/activate
python -m pip install -r ${INTEL_OPENVINO_DIR}/tools/model_optimizer/requirements_tf2.txt
python -m pip install -r ${INTEL_OPENVINO_DIR}/extras/open_model_zoo/tools/model_tools/requirements.in
python -m pip install -r ${INTEL_OPENVINO_DIR}/extras/open_model_zoo/tools/model_tools/requirements-pytorch.in
python -m pip install -r ${INTEL_OPENVINO_DIR}/extras/open_model_zoo/tools/model_tools/requirements-caffe2.in
deactivate
