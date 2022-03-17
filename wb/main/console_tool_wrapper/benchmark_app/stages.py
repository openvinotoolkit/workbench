"""
 OpenVINO DL Workbench
 Class for storing int8 calibration cli params

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
from wb.main.console_tool_wrapper.stages import Stages


class BenchmarkAppStages(Stages):
    stages = {
        'Parsing and validating input arguments': 0.09,
        'Loading Inference Engine': 0.09,
        'Reading the Intermediate Representation network': 0.09,
        'Resizing network to match image sizes and given batch': 0.09,
        'Configuring input of the model': 0.09,
        'Setting device configuration': 0.09,
        'Loading the model to the device': 0.09,
        'Setting optimal runtime parameters': 0.09,
        'Creating infer requests and filling input blobs with images': 0.09,
        'Measuring performance': 0.09,
        'Dumping statistics report': 0.09
    }
