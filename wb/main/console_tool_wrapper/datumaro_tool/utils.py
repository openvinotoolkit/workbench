"""
 OpenVINO DL Workbench
 Utils for working with Datumaro functions

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
import json

from wb.extensions_factories.database import get_db_session_for_app
from wb.main.console_tool_wrapper.datumaro_tool.tool import DatumaroTool
from wb.main.enumerates import DatumaroModesEnum
from wb.main.jobs.tools_runner.local_runner import LocalRunner
from wb.main.models.datasets.tfds_datasets_model import TFDSDatasetModel
from wb.main.shared.enumerates import DatasetTypesEnum


#TODO: proper filtering
def fetch_tfds_datasets():

    tool = DatumaroTool()
    tool.set_mode(DatumaroModesEnum.download_info)
    report_path = DATASET_RECOGNITION_REPORTS_FOLDER / 'tfds_list.json'
    tool.set_path('json-report', report_path)

    runner = LocalRunner(tool)
    return_code, _ = runner.run_console_tool()
    if return_code:
        pass
    with open(report_path, 'r') as fp:
        datasets = json.load(fp)

    for dataset_id, dataset_data in datasets.items():
        params = {
            'label': dataset_id,
            'name': dataset_data['human_name'],
            'description': dataset_data['description'],
            'default_format': dataset_data['default_output_format'],
            'homepage': dataset_data['home_url'],
            'version': dataset_data['version'],
            'download_size': dataset_data['download_size'],
            'num_classes': dataset_data['num_classes'],
            'subset_data': dataset_data['subsets'],
        }
        dataset_record = TFDSDatasetModel(**params)
        dataset_record.write_record(get_db_session_for_app())


def filter_supported_datasets():
    supported_datasets = TFDSDatasetModel.query \
        .filter(
            TFDSDatasetModel.default_format.notin_(DatasetTypesEnum),
        ).all()

    return supported_datasets
