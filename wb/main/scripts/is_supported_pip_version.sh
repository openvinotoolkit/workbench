#!/bin/bash

MINIMAL_MAJOR_REQUIRED_PIP_VERSION=18

CURRENT_PIP_VERSION=$(python3 -m pip --version)

PIP_VERSION_PATTERN="^pip ([0-9]+)*"
if [[ ${CURRENT_PIP_VERSION} =~ ${PIP_VERSION_PATTERN}  ]]; then
    PIP_VERSION=${BASH_REMATCH[1]}
    if [ "${PIP_VERSION}" -ge "${MINIMAL_MAJOR_REQUIRED_PIP_VERSION}" ]; then
        echo "Pip ${PIP_VERSION} is supported."
        exit 0
    fi
fi
echo "Pip ${PIP_VERSION} is not supported."
exit 1


