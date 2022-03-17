#!/bin/bash
# Copyright (c) 2018-2019 Intel Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

rabbitmq_path=/usr/lib/rabbitmq/bin
rabbitmq_executor=${rabbitmq_path}/rabbitmqctl

rabbitmq-server &> ${WB_LOG_FILE} &

${rabbitmq_path}/rabbitmq-server-wait

${rabbitmq_executor} add_user openvino ${RABBITMQ_PASSWORD} -q
sleep 2
${rabbitmq_executor} add_vhost openvino_vhost -q
sleep 2
${rabbitmq_executor} set_permissions -p openvino_vhost openvino ".*" ".*" ".*" -q
