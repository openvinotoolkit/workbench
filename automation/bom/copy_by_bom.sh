#!/usr/bin/env bash

while (( "$#" )); do
  case "$1" in
    --path_to_bom)
      path_to_bom=$2
      shift 2
      ;;
    --source_path)
      source_path=$2
      shift 2
      ;;
    --destination_path)
      destination_path=$2
      shift 2
      ;;
    *)
      echo Unsupport argument $1
      exit 1
      ;;
  esac
done


package_files=$(cat ${path_to_bom})

mkdir -p $destination_path

pushd $source_path

for f in $package_files; do
  dest=$(dirname "${f}")
  mkdir -p "${destination_path}/${dest}"
  cp -r "${f}" "${destination_path}/${dest}"
done

popd
