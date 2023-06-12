#!/bin/bash

while (( "$#" )); do
  case "$1" in
    --notebooks_venv)
      NOTEBOOKS_VENV=$2
      shift 2
      ;;
    *)
      echo Unsupport argument $1
      exit 1
      ;;
  esac
done

set -e

python3 -m virtualenv ${NOTEBOOKS_VENV} 
source ${NOTEBOOKS_VENV}/bin/activate
python3 -m pip install --upgrade pip==23.0.1
python3 -m pip install setuptools==65.5.1
python3 -m pip install --no-cache-dir ipykernel
python3 -m ipykernel install --user --name jupyter_env

PYTHON_WHEEL_VERSION='38'
pushd ${WHEELS_PATH}
  find . -name "openvino-202*cp${PYTHON_WHEEL_VERSION}*.whl" -exec python3 -m pip install {} \;
  find . -name "openvino_dev*.whl" -exec python3 -m pip install {} \;
popd

deactivate
