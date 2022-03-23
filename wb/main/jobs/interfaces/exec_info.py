"""
 OpenVINO DL Workbench
 Class for execution results

 Copyright (c) 2018 Intel Corporation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
      http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
"""


class ExecInfo:
    def __init__(self, batch: int,
                 request: int,
                 latency: float = None,
                 throughput: float = None,
                 total_exec_time: float = 0):
        self.batch = batch
        self.request = request
        self.latency = latency
        self.throughput = throughput
        self.total_exec_time = total_exec_time

    def json(self):
        return {
            'batch': self.batch,
            'nireq': self.request,
            'latency': self.latency,
            'throughput': self.throughput,
            'totalExecTime': self.total_exec_time
        }
