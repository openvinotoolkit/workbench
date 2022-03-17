"""
 OpenVINO DL Workbench
 Utils for work with OMZ tools

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
import logging
import pathlib
from itertools import chain
from pathlib import Path
from typing import Union, Dict, Optional

import yaml
from sqlalchemy.sql.elements import and_
from model_analyzer.constants import YoloAnchors

from config.constants import ACCURACY_CHECKER_PATH, OPEN_MODEL_ZOO_MODELS_PATH, DATASET_DEFINITIONS_PATH
from wb.extensions_factories.database import get_db_session_for_app
from wb.main.accuracy_utils.yml_abstractions import Adapter
from wb.main.accuracy_utils.yml_templates.adapter_templates import format_yolo_anchors
from wb.main.accuracy_utils.yml_templates.registry import ConfigRegistry
from wb.main.console_tool_wrapper.model_downloader.info_dumper_parser import InfoDumperParser
from wb.main.console_tool_wrapper.model_downloader.info_dumper_tool import InfoDumperTool
from wb.main.enumerates import TaskMethodEnum, SupportedFrameworksEnum, ModelPrecisionEnum
from wb.main.jobs.tools_runner.local_runner import LocalRunner
from wb.main.models import ModelPrecisionsModel, OMZTopologyModel, WBInfoModel
from wb.main.shared.enumerates import TaskEnum

#TODO: proper filtering
def fetch_tfds_datasets():
    metadata_from_accuracy_configs = get_metadata_from_accuracy_configs()
    omz_models_from_info_dumper = get_omz_models_data_from_info_dumper()
    default_metadata = get_default_metadata()

    for model_data_from_info_dumper in omz_models_from_info_dumper:
        model_name = model_data_from_info_dumper['name']
        model_metadata_from_accuracy_config = metadata_from_accuracy_configs.get(model_name, default_metadata)

        if model_data_from_info_dumper['framework'] == 'dldt':
            model_data_from_info_dumper['framework'] = SupportedFrameworksEnum.openvino.value

        try:
            SupportedFrameworksEnum(model_data_from_info_dumper['framework'])
        except ValueError:
            logging.warning('Skip %s model due to unsupported framework %s', model_data_from_info_dumper['name'],
                            model_data_from_info_dumper['framework'])
            continue

        task_type = get_topology_task_by_task_method(model_metadata_from_accuracy_config['topology_type'],
                                                     model_data_from_info_dumper)

        config = dict(
            data=model_data_from_info_dumper,
            task_type=task_type,
            topology_type=model_metadata_from_accuracy_config['topology_type'],
            advanced_configuration=model_metadata_from_accuracy_config['advanced_configuration'],
            inputs=model_metadata_from_accuracy_config.get('inputs', []),
        )

        precisions = []
        for precision in model_data_from_info_dumper['precisions']:
            precisions.append(precision.split('-'))

        for full_precision in precisions:
            # for each model with mixed precision, e.g. FP32-FP16, a duplicate row in OMZTopologyModel table is created
            config['source'] = get_model_files_source(model_name)
            omz_record = OMZTopologyModel(**config)
            omz_record.write_record(get_db_session_for_app())

            for precision in full_precision:
                precision_record = ModelPrecisionsModel(
                    omz_record.id,
                    ModelPrecisionEnum(precision)
                )
                precision_record.write_record(get_db_session_for_app())


def filter_unsupported_datasets():
    # Filter rule #1: Show only models with not generic type
    not_supported_topologies = ('aclnet',
                                'asl-recognition-0004',
                                'common-sign-language-0001',
                                'common-sign-language-0002',
                                'facial-landmarks-35-adas-0002',
                                'i3d-rgb-tf',
                                'mixnet-l',
                                'netvlad-tf',
                                'open-closed-eye-0001',
                                # TODO: unskip when 65499 will be fixed
                                'densenet-161-tf',
                                'se-resnet-101',
                                'se-resnet-50',
                                'se-resnet-152',
                                'drn-d-38',
                                'se-inception',
                                'densenet-169',
                                'se-resnext-50',
                                'ssd512',
                                'Sphereface',
                                'densenet-121',
                                'densenet-161',
                                'ssd300',
                                'densenet-201',
                                'se-resnext-101',
                                'mobilenet-ssd',
                                )

    supported_topologies = OMZTopologyModel.query \
        .filter(
        and_(
            OMZTopologyModel.task_type != TaskEnum.generic,
            OMZTopologyModel.name.notin_(not_supported_topologies),
        )
    ).all()

    semantic_segmentation_necessary_postprocessing_type = ('encode_segmentation_mask',)
    aggregated_models = []
    for model in supported_topologies:
        precisions = [p.precision.value for p in model.precisions]

        # Filter rule #2: Show any precision except INT1
        if set(precisions) & {ModelPrecisionEnum.i1.value}:
            continue

        # Filter rule #3: Show VOC Segmentation-compatible Semantic Segmentation models only "
        if model.task_type == TaskEnum.semantic_segmentation:
            advanced_configuration = json.loads(model.advanced_configuration)
            postprocessing = advanced_configuration['postprocessing']
            is_supported = list(filter(
                lambda postprocessing: postprocessing['type'] in semantic_segmentation_necessary_postprocessing_type,
                postprocessing
            ))
            if not is_supported:
                continue

        if model.name in not_supported_topologies:
            continue

        share_same_name = [x for x in aggregated_models if model.name == x['name']]

        if not share_same_name:
            model_data = {
                **model.json(),
                'precision': precisions,
                'isAvailable': is_model_available(model)
            }
            aggregated_models.append(model_data)
            continue

        existing_json_model = share_same_name[0]

        for precision_value in precisions:
            if precision_value not in existing_json_model['precision']:
                existing_json_model['precision'].append(precision_value)

    return aggregated_models
