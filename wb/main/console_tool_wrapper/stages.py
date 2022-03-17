"""
 OpenVINO DL Workbench
 Interface for processing stages and progress for inference engine tools

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


class Stages:
    stages = {}

    @classmethod
    def get_weight_for_stage(cls, stage: str) -> float:
        return cls.stages.get(stage, 0)

    @classmethod
    def get_stages(cls) -> tuple:
        return tuple(cls.stages.keys())
