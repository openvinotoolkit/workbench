"""
 OpenVINO DL Workbench
 Accuracy checker's configuration registry

 Copyright (c) 2018-2019 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
from wb.main.accuracy_utils.yml_templates.adapter_templates import (get_classification_adapter, get_inpainting_adapter,
                                                                    get_mask_rcnn_adapter, get_segmentation_adapter,
                                                                    get_ssd_adapter, get_style_transfer_adapter,
                                                                    get_super_resolution_adapter,
                                                                    get_generic_adapter,
                                                                    get_tiny_yolo_v2_adapter, get_yolo_v2_adapter)
from wb.main.accuracy_utils.yml_templates.registry import ConfigRegistry
