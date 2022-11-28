#!/bin/bash


printf "\nDownload and install OpenVINO packages\n\n"

set +e


if [[ "$OSTYPE" == "linux-gnu" ]]; then
  os_name="linux"
  package_extension="sh"
  package_prefix="l"
elif [[ "$OSTYPE" == "darwin"* ]]; then
  os_name="osx"
  package_extension="dmg"
  package_prefix="m"
fi

PARENT_PACKAGE_PATH="$(grep openvino_package: ./automation/Jenkins/openvino_version.yml | grep -o 'http.*')"
PACKAGE_NUMBER="$(grep openvino_image_tag: ./automation/Jenkins/openvino_version.yml |grep -o '[0-9]*\.[0-9]\.[0-9]*')"


PARENT_PACKAGE_PATH="${PARENT_PACKAGE_PATH}irc/$os_name"

package_filename="l_openvino_toolkit.${package_extension}"
package_name_pattern="${package_prefix}_openvino_toolkit_p_202[0-9]\.[0-9](\.[0-9])?\.[0-9]+_offline\.${package_extension}"
package_name=$(curl ${PARENT_PACKAGE_PATH}/ | grep -oP -- "${package_name_pattern}")
package="${PARENT_PACKAGE_PATH}/${package_name}"

export PACKAGE_PATH="${HOME}/Downloads/${package_filename}"

if [ -f "${PACKAGE_PATH}" ]; then
  rm -rf ${PACKAGE_PATH}
fi

curl -o ${PACKAGE_PATH} -k ${package}

if [[ "$OSTYPE" == "linux-gnu" ]]; then

    chmod +x ${PACKAGE_PATH}

    bash ${PACKAGE_PATH} -a --action install --components all --install-dir ${HOME}/intel --eula accept -s

    set -e

elif [[ "$OSTYPE" == "darwin"* ]]; then
    hdiutil attach "${PACKAGE_PATH}"
    cd /Volumes/m_*
    echo "Use install \"as a current user\""
    open -g -W "*.app"
    sudo spctl --master-disable
fi
