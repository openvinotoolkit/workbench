"""
 OpenVINO DL Workbench
 Class for execution results

 Copyright (c) 2018 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
