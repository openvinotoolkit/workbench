"""
 OpenVINO DL Workbench
 Class for creating ORM local int8 calibration pipeline model and dependent models

 Copyright (c) 2020 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
from typing import Tuple

from sqlalchemy.orm import Session

from wb.main.enumerates import OptimizationTypesEnum
from wb.main.models import Int8CalibrationJobModel, PipelineModel, TopologiesModel
from wb.main.models.int8_calibration_job_model import Int8CalibrationJobData
from wb.main.pipeline_creators.optimization_pipeline_creator import (OptimizationPipelineCreator, \
                                                                     OptimizationPipelineCreatorData)


class Int8CalibrationConfig(Int8CalibrationJobData):
    targetId: int
    modelId: int
    targetId: int
    deviceId: int


class Int8CalibrationPipelineCreatorData(OptimizationPipelineCreatorData):
    int8CalibrationConfig: Int8CalibrationConfig


class Int8CalibrationPipelineCreator(OptimizationPipelineCreator):
    optimization_configuration: Int8CalibrationConfig

    def __init__(self, configuration: Int8CalibrationPipelineCreatorData):
        self.optimization_configuration = configuration['int8CalibrationConfig']
        target_id = self.optimization_configuration['targetId']
        super().__init__(configuration=configuration, target_id=target_id)

    def _create_int8_job(self, pipeline_id: int, int8_model_id: int, session: Session) -> Int8CalibrationJobModel:
        int8_project_configuration = {
            **self.optimization_configuration,
            'modelId': int8_model_id,
            'datasetId': self.profiling_configuration['datasetId']
        }

        int8_project_id = (
            self.create_project_and_save_to_configuration(configuration=int8_project_configuration,
                                                          optimization_type=OptimizationTypesEnum.int8calibration,
                                                          session=session)
        )

        self.optimization_configuration['projectId'] = int8_project_id
        self.optimization_configuration['pipelineId'] = pipeline_id
        int8_job = Int8CalibrationJobModel(self.optimization_configuration)
        int8_job.result_model_id = int8_model_id
        self._save_job_with_stage(int8_job, session)
        return int8_job

    def _create_int8_pipeline_jobs(self, int8_model: TopologiesModel,
                                   pipeline: PipelineModel, session: Session) -> Tuple[int, int]:
        int8_job = self._create_int8_job(pipeline_id=pipeline.id, int8_model_id=int8_model.id, session=session)
        self._set_optimized_model_path(optimized_model=int8_model, optimization_job_id=int8_job.job_id, session=session)
        self._set_optimized_project_ac_config(self.optimization_configuration['projectId'], session)
        topology_analysis_job = self._create_topology_analysis_job(pipeline, int8_model, int8_job, session)
        return int8_model.id, topology_analysis_job.job_id
