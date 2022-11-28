#!/bin/bash

while (( "$#" )); do
  case "$1" in
    -d|--device)
      DEVICE=$2
      shift 2
      ;;
    *)
      echo Unsupport argument $1
      exit 1
      ;;
  esac
done

set -e

if [ ${DEVICE} == 'vpu' ]
then
  DEVICE = 'myriad'
fi

${SCRIPTS_FOLDER}/ie_sample ${MODEL_FOLDER}/squeezenet1.1.xml ${DEVICE} 1 1