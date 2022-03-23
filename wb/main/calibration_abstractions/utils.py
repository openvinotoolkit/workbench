"""
 OpenVINO DL Workbench
 Utils for calibration config

 Copyright (c) 2018-2019 Intel Corporation

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
import json
import os
from pathlib import Path

import math

from wb.error.job_error import Int8CalibrationError
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.accuracy_utils.accuracy_utils import construct_accuracy_tool_config
from wb.main.calibration_abstractions.algorithm import QuantizationAlgorithm, DefaultParams, AccuracyAwareParams
from wb.main.calibration_abstractions.compression import Compression
from wb.main.calibration_abstractions.config import Config
from wb.main.calibration_abstractions.model import Model
from wb.main.enumerates import QuantizationAlgorithmEnum
from wb.main.models import (ProjectsModel, DatasetsModel, DevicesModel, Int8CalibrationJobModel, ProjectAccuracyModel,
                            TopologiesModel)
from wb.main.shared.constants import ALLOWED_EXTENSIONS_IMG
from wb.main.shared.enumerates import TaskEnum
from wb.main.shared.utils import find_all_paths_by_exts


def construct_calibration_tool_config(model: TopologiesModel,
                                      calibration_params: Int8CalibrationJobModel) -> Config:
    dataset = calibration_params.dataset
    device = calibration_params.project.device

    stat_subset_size = math.ceil(dataset.number_images / 100 * calibration_params.subset_size)
    if stat_subset_size < 1:
        raise Int8CalibrationError(f'Cannot apply {calibration_params.subset_size} for '
                                   f'dataset contains {dataset.number_images} images', calibration_params.job_id)

    quantize_algorithm_params = create_quantize_algorithm_params(calibration_params, stat_subset_size)

    calibration_config = create_calibration_config(calibration_params.algorithm, model,
                                                   dataset, device, calibration_params)

    compression = Compression(device.type,
                              QuantizationAlgorithm(calibration_params.algorithm, quantize_algorithm_params))

    model = Model(model)

    return Config(model, calibration_config, compression)


def create_quantize_algorithm_params(calibration_params: Int8CalibrationJobModel,
                                     stat_subset_size: int) -> DefaultParams:
    if calibration_params.algorithm == QuantizationAlgorithmEnum.default:
        return DefaultParams(calibration_params.preset, stat_subset_size)

    if calibration_params.algorithm == QuantizationAlgorithmEnum.accuracy_aware:
        maximal_drop = calibration_params.threshold / 100
        return AccuracyAwareParams(calibration_params.preset, stat_subset_size, maximal_drop, metric_subset_ratio=1)

    raise Int8CalibrationError(f'Algorithm {calibration_params.algorithm.value} does not supported',
                               calibration_params.job_id)


def create_calibration_config(algorithm: QuantizationAlgorithmEnum,
                              topology_record: TopologiesModel,
                              dataset_record: DatasetsModel,
                              device: DevicesModel,
                              calibration_params: Int8CalibrationJobModel):
    inputs = topology_record.analysis_job.json()['inputs']
    task_type: TaskEnum = topology_record.meta.task_type

    dataset_compatible = task_type in [task.task_type for task in dataset_record.task_types]

    is_simplify_mode = (
            algorithm == QuantizationAlgorithmEnum.default
            and len(inputs) == 1
            and (task_type == TaskEnum.generic or not dataset_compatible)
    )

    if is_simplify_mode:
        try:
            image_path = next(find_all_paths_by_exts(dataset_record.path,
                                                     ALLOWED_EXTENSIONS_IMG,
                                                     result_type=Path,
                                                     recursive=True))
        except StopIteration:
            raise Int8CalibrationError(f'Cannot find images for dataset {dataset_record.id}', calibration_params.job_id)
        return {
            'type': 'simplified',
            # TODO: use single extension until 59323 fixed
            'data_source': os.path.join(image_path.parent, f'*{image_path.suffix}')
        }

    original_project: ProjectsModel = calibration_params.project.get_parent_project(session=get_db_session_for_celery())
    project_accuracy: ProjectAccuracyModel = original_project.accuracy

    if project_accuracy:
        # apply calibration dataset paths
        original_dataset_path = original_project.dataset.path
        raw_config = project_accuracy.raw_configuration.replace(original_dataset_path, dataset_record.path)

        calibration_config = json.loads(raw_config)['models'][0]

        # clear model paths from ac config, calibration 2.0 overrides it internally later
        # otherwise accuracy is measured for original model
        del calibration_config['launchers'][0]['model']
        del calibration_config['launchers'][0]['weights']

    else:
        calibration_config = construct_accuracy_tool_config(topology_record, dataset_record, device)
        # clear model paths from ac config, calibration 2.0 overrides it internally later
        # otherwise accuracy is measured for original model
        calibration_config.launcher.model = None
        calibration_config.launcher.weights = None

        calibration_config = calibration_config.to_dict()['models'][0]

    return calibration_config
