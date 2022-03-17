#!/bin/bash

# Copyright (c) 2021 Intel Corporation
#
# LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
# the terms and conditions of the software license agreements for Software Package, which may also include
# notices, disclaimers, or license terms for third party or open source software
# included in or with the Software Package, and your use indicates your acceptance of all such terms.
# You may obtain a copy of the License at
#      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf

# Check if Python is installed
python3 --version > /dev/null 2>&1

if [[ $? -ne 0 ]]; then
    echo "Error: Python 3 is not installed. Please install Python 3.6 ^(64-bit^) or higher from https://www.python.org/downloads/"
    exit 1
fi

# Check if Python version is supported
python_version=$(python3 -c 'import sys; print(str(sys.version_info[0])+"."+str(sys.version_info[1]))')
MINIMUM_REQUIRED_PYTHON_VERSION="3.6"
if [[ -n "$python_version" && "$(printf '%s\n' "$python_version" "$MINIMUM_REQUIRED_PYTHON_VERSION" | sort -V | head -n 1)" != "$MINIMUM_REQUIRED_PYTHON_VERSION" ]]; then
    echo "ERROR: Unsupported Python version. Please install Python 3.6 ^(64-bit^) or higher from https://www.python.org/downloads/"
    exit 1
fi

# Install wrapper
python3 -m pip install -U openvino-workbench

if [[ $? -ne 0 ]]; then
    echo "Error: openvino-workbench package could not be installed. There might be a problem with proxies. Please set them in the terminal and try again."
    echo "You can find additional information regarding DL Workbench Python starter on the PyPI page: https://pypi.org/project/openvino-workbench/"
    echo "You can contact our team on the Intel Community Forum: https://community.intel.com/t5/Intel-Distribution-of-OpenVINO/bd-p/distribution-openvino-toolkit"
    exit 1
fi

echo -e "\nopenvino-workbench package installed successfully. You can start DL Workbench with the following command:"
echo "  openvino-workbench"
echo "It will start DL Workbench with the default arguments and capabilities. To see the list of available arguments, run the following command:"
echo "  openvino-workbench --help"
echo "
See documentation for additional information:
https://docs.openvinotoolkit.org/latest/workbench_docs_Workbench_DG_Install.html
"
