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
import os

from sqlalchemy.orm import Session
from typing_extensions import TypedDict

from config.constants import ORIGINAL_FOLDER
from wb.main.enumerates import SupportedFrameworksEnum, StatusEnum
from wb.main.models import JobsModel, PipelineModel, TopologiesModel, TopologyAnalysisJobsModel, ProjectsModel
from wb.main.models.project_accuracy_model import ProjectAccuracyModel
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator


class OptimizationConfig(TypedDict):
    targetId: int
    modelId: int
    datasetId: int
    targetId: int
    deviceId: int
    projectId: int
    pipelineId: int


class OptimizationPipelineCreatorData(TypedDict):
    profilingConfig: dict


class OptimizationPipelineCreator(PipelineCreator):
    optimization_configuration: OptimizationConfig

    def __init__(self, configuration: OptimizationPipelineCreatorData, target_id: int):
        super().__init__(target_id=target_id)
        self.configuration = configuration
        self.profiling_configuration = self.configuration['profilingConfig']
        self.optimization_configuration['targetId'] = self._target_id
        self.profiling_configuration['targetId'] = self._target_id

    def _create_optimized_model(self, session: Session) -> TopologiesModel:
        original_model = TopologiesModel.query.get(self.optimization_configuration['modelId'])

        optimized_model = TopologiesModel(
            name=original_model.name,
            framework=SupportedFrameworksEnum.openvino,
            metadata_id=original_model.metadata_id,
        )

        optimized_model.optimized_from = original_model.id
        optimized_model.status = StatusEnum.running
        optimized_model.source = original_model.source
        optimized_model.domain = original_model.domain
        optimized_model.write_record(session)
        return optimized_model

    @staticmethod
    def _set_optimized_model_path(optimized_model: TopologiesModel, optimization_job_id: int, session: Session):
        original_model = optimized_model.original_model
        model_path = original_model.path
        if ORIGINAL_FOLDER in model_path:
            model_path = os.path.dirname(model_path)
        tuned_path = os.path.join(model_path, str(optimization_job_id))
        optimized_model.path = tuned_path
        optimized_model.write_record(session)

    @staticmethod
    def _set_optimized_project_ac_config(project_id: int, session: Session):
        project: ProjectsModel = ProjectsModel.query.get(project_id)
        parent_project: ProjectsModel = project.get_parent_project()
        if not parent_project or not parent_project.accuracy:
            return

        accuracy_config = parent_project.accuracy.raw_configuration
        accuracy_config = accuracy_config.replace(parent_project.topology.path, project.topology.path)
        accuracy_config = accuracy_config.replace(parent_project.dataset.path, project.dataset.path)

        project_accuracy = ProjectAccuracyModel()

        project_accuracy.raw_configuration = accuracy_config
        project_accuracy.write_record(session)

        project.project_accuracy_id = project_accuracy.id
        project.write_record(session)

    def _create_topology_analysis_job(self, pipeline: PipelineModel, optimized_model: TopologiesModel,
                                      optimization_job: JobsModel, session: Session) -> TopologyAnalysisJobsModel:
        topology_analysis_job = TopologyAnalysisJobsModel({
            'modelId': optimized_model.id,
            'pipelineId': pipeline.id,
            'previousJobId': optimization_job.job_id,
            'projectId': optimization_job.project_id,
        })

        self._save_job_with_stage(topology_analysis_job, session)
        return topology_analysis_job
