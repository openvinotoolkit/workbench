#!/usr/bin/env bash

set -ex

IMAGE_NAME=wb_ubuntu
IMAGE_TAG=for_remote_execution
CONTAINER_NAME="${IMAGE_NAME}_${IMAGE_TAG}"

docker stop ${CONTAINER_NAME} && docker rm ${CONTAINER_NAME}

docker build -t ${IMAGE_NAME}:${IMAGE_TAG} --build-arg http_proxy=${HTTP_PROXY} --build-arg https_proxy=${HTTPS_PROXY}  .

docker run -d \
       --device /dev/dri \
       --device-cgroup-rule='c 189:* rmw' -v /dev/bus/usb:/dev/bus/usb \
       --name ${CONTAINER_NAME} \
       ${IMAGE_NAME}:${IMAGE_TAG}

CONTAINER_IP=$(docker inspect --format '{{ .NetworkSettings.IPAddress }}' ${CONTAINER_NAME})
echo "Container ${CONTAINER_NAME} is allowed by IP ${CONTAINER_IP}"
