#!/bin/bash

pushd ${WORKSPACE}/workbench/tests/jupyter_tests

while (( "$#" )); do
  case "$1" in
    --container_name)
      container_name=$2
      shift 2
      ;;
    *)
      echo Unsupported argument $1
      exit 1
      ;;
  esac
done

PATH_TO_NOTEBOOK_PARENT_PROJECT=/home/workbench/.workbench/jupyter_notebooks/1/project_1.ipynb
PATH_TO_NOTEBOOK_CALIBRATED_PROJECT=/home/workbench/.workbench/jupyter_notebooks/2/project_2.ipynb
PATH_TO_NOTEBOOK_SECOND_PARENT_PROJECT=/home/workbench/.workbench/jupyter_notebooks/3/project_3.ipynb

NOTEBOOK_PATHS=(${PATH_TO_NOTEBOOK_PARENT_PROJECT} ${PATH_TO_NOTEBOOK_CALIBRATED_PROJECT} ${PATH_TO_NOTEBOOK_SECOND_PARENT_PROJECT})

for notebook_path in "${NOTEBOOK_PATHS[@]}"
do
  # Execute notebook
  docker exec ${container_name} bash -c "jupyter nbconvert --to notebook --inplace --execute --ExecutePreprocessor.timeout=800 ${notebook_path}"

  # Get output
  executed_notebook_output=$(docker exec ${container_name} bash -c "cat ${notebook_path}")

  # Validate output
  python3 jupyter_notebook_output_validator.py --notebook-output "${executed_notebook_output}" --errors-to-skip-path errors_to_skip.json
  NOTEBOOK_VALIDATION_EXIT_CODE=$?
  if [[ ${NOTEBOOK_VALIDATION_EXIT_CODE} -ne 0 ]]; then
    echo "Jupyter notebook was not executed correctly."
    echo "Executed notebook content: "
    echo "${executed_notebook_output}"
    exit ${NOTEBOOK_VALIDATION_EXIT_CODE}
  fi

done

popd
