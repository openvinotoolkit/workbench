#!/bin/bash

SUPPORTED_OS_NAME="Ubuntu"
SUPPORTED_OS_VERSION=(18.04 20.04)

PRETTY_NAME=$(cat /etc/os-release | grep PRETTY_NAME | grep -oP "\"[A-Za-z0-9.\s]*\"" | grep -oP "[A-Za-z0-9.\s]*")

SUPPORTED_PRETTY_NAME_PATTERN="${SUPPORTED_OS_NAME} [0-9]{2}.[0-9]{2}"

if [[ ! ${PRETTY_NAME} =~ .*${SUPPORTED_PRETTY_NAME_PATTERN}.* ]]; then
  echo "Found OS: ${PRETTY_NAME} is not supported."
  exit 1
fi

export CURRENT_OS_VERSION=$(echo ${PRETTY_NAME} | grep -oE "[0-9]{2}.[0-9]{2}")

if [[ ! " ${SUPPORTED_OS_VERSION[@]} " =~ " ${CURRENT_OS_VERSION} " ]]; then
  echo "Found OS: ${PRETTY_NAME} is not supported."
  echo "Version ${CURRENT_OS_VERSION} is not supported."
  exit 1
fi

echo "${PRETTY_NAME} is supported."
