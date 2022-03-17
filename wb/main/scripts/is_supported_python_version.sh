#!/bin/bash

SUPPORTED_PYTHON_VERSIONS=(3.6 3.7 3.8)

FULL_PYTHON_VERSION=$(python3 -V)

if [ $? != 0 ]; then
  echo "Python is not installed on the machine."
  exit 1
fi

PYTHON_VERSION=${FULL_PYTHON_VERSION:7:3}

if [[ ! " ${SUPPORTED_PYTHON_VERSIONS[@]} " =~ " ${PYTHON_VERSION} " ]]; then
  echo "Python ${PYTHON_VERSION} is not supported."
  exit 1
fi

echo "Python ${PYTHON_VERSION} is supported."
