"""
 OpenVINO DL Workbench
 Class for storing int8 calibration cli params

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
