#!/bin/bash

while (("$#")); do
    case "$1" in
    --container_name)
        container_name=$2
        shift 2
        ;;
    --path_to_bom)
        path_to_bom=$2
        shift 2
        ;;
    *)
        echo Unsupported argument "$1"
        exit 1
        ;;
    esac
done

PATH_TO_WORKBENCH=/opt/intel/openvino/tools/workbench

grep ".ipynb$" "${path_to_bom}" | while read -r filename; do
    echo "Executing ${filename}"

    notebook_path="${PATH_TO_WORKBENCH}/${filename}"
    notebook_dir="$(dirname "${notebook_path}")"
    notebook_name="$(basename "${notebook_path}")"

    docker exec \
        --workdir "${notebook_dir}" \
        "${container_name}" \
        bash -c "source \${NOTEBOOKS_VENV}/bin/activate; jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=800 '${notebook_name}'"

    NOTEBOOK_EXECUTION_EXIT_CODE=$?

    if [[ ${NOTEBOOK_EXECUTION_EXIT_CODE} -ne 0 ]]; then
        echo "Jupyter notebook was not executed correctly."

        # Get output of the executed notebook
        executed_notebook_output=$(docker exec --workdir "${notebook_dir}" "${container_name}" bash -c "cat ${notebook_name}")
        # Show if an error occurred
        echo "Executed notebook content: "
        echo "${executed_notebook_output}"

        exit ${NOTEBOOK_EXECUTION_EXIT_CODE}
    fi
done
