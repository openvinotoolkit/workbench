# This script MUST be run ONLY from workbench repository root

set -e

######################################################################################################################
# Environment variables
######################################################################################################################
printf "\n Updating repository (checkout submodules) \n\n"

pushd ${OPENVINO_WORKBENCH_ROOT}
  git submodule update --init --recursive
popd
