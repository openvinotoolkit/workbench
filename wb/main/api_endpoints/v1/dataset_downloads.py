"""
 OpenVINO DL Workbench
 Endpoints for operating with dataset downloads

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
from flask import jsonify

from wb.main.api_endpoints.v1 import V1_MODELS_API
from wb.main.console_tool_wrapper.datumaro_tool.utils import fetch_tfds_datasets, filter_supported_datasets
from wb.main.models.datasets.tfds_datasets_model import TFDSDatasetModel
from wb.main.utils.safe_runner import safe_run


@V1_MODELS_API.route('/tfds-datasets', methods=['GET'])
@safe_run
def list_tfds_datasets():
    if not TFDSDatasetModel.query.all():
        fetch_tfds_datasets()
    result = filter_supported_datasets()
    return jsonify(result)


@V1_MODELS_API.route('/tfds-datasets', methods=['POST'])
@safe_run
def download_tfds_dataset():
    pass
