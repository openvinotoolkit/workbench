# Install pre-commit hooks
set -e

source ${OPENVINO_WORKBENCH_ROOT}/.venv/bin/activate
pre-commit install
pre-commit install --hook-type pre-push

pushd ${OPENVINO_WORKBENCH_ROOT}/client

popd
