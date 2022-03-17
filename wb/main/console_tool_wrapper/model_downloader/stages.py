"""
 OpenVINO DL Workbench
 Class representing model downloader stages

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


class ModelDownloadStages(Stages):
    def __init__(self, files_count):
        self.stages = {'Downloading': 0.8 / files_count, 'Post processing': 0.2}

    def get_stages(self) -> tuple:
        return tuple(self.stages.keys())
