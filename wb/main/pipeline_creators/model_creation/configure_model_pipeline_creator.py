"""
 OpenVINO DL Workbench
 Class for creating pipeline to reshape a model

 Copyright (c) 2021 Intel Corporation

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
from typing import List, Optional

from sqlalchemy.orm import Session

from wb.main.enumerates import PipelineTypeEnum, TargetTypeEnum, PipelineStageEnum
from wb.main.models import (TargetModel, ReshapeModelJobModel, CreateReshapeModelScriptsJobModel,
                            PipelineModel, ModelShapeConfigurationModel, TopologyAnalysisJobsModel,
                            TopologiesModel)
from wb.main.models.apply_model_layout_model import ApplyModelLayoutJobModel, ApplyModelLayoutJobData
from wb.main.models.model_shape_configuration_model import InputShapeConfiguration
from wb.main.models.reshape_model_job_model import ReshapeModelJobData
from wb.main.models.jobs_model import JobData
from wb.main.models.topologies_metadata_model import InputLayoutConfiguration
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator

SHAPE_CONFIG_TYPE = List[InputShapeConfiguration]
LAYOUT_CONFIG_TYPE = List[InputLayoutConfiguration]


class ConfigureModelPipelineCreator(PipelineCreator):
    pipeline_type = PipelineTypeEnum.configure_model

    _job_type_to_stage_map = {
        CreateReshapeModelScriptsJobModel.get_polymorphic_job_type():
            PipelineStageEnum.preparing_reshape_model_assets,
        ReshapeModelJobModel.get_polymorphic_job_type():
            PipelineStageEnum.reshape_model,
        ApplyModelLayoutJobModel.get_polymorphic_job_type():
            PipelineStageEnum.apply_model_layout,
        TopologyAnalysisJobsModel.get_polymorphic_job_type():
            PipelineStageEnum.model_analyzer,
    }

    def __init__(self, model_id: int, shape_configuration: Optional[SHAPE_CONFIG_TYPE],
                 layout_configuration: LAYOUT_CONFIG_TYPE, save_model: bool = False):
        local_target_model = TargetModel.query.filter_by(target_type=TargetTypeEnum.local).first()
        super().__init__(target_id=local_target_model.id)
        self._model_id = model_id
        self._shape_configuration = shape_configuration
        self._layout_configuration = layout_configuration
        self._save_model = save_model

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        topology: TopologiesModel = TopologiesModel.query.get(self._model_id)
        topology.meta.layout_configuration = self._layout_configuration
        topology.meta.write_record(session)

        if self._shape_configuration:
            reshape_model_job_id = self._add_reshape_related_jobs(pipeline, session)
        else:
            reshape_model_job_id = None

        apply_model_layout_job = ApplyModelLayoutJobModel(
            ApplyModelLayoutJobData(
                pipelineId=pipeline.id,
                projectId=None,
                previousJobId=reshape_model_job_id,
                model_id=self._model_id,
                layout=self._layout_configuration,
            )
        )
        self._save_job_with_stage(apply_model_layout_job, session=session)

        topology_analysis_job = TopologyAnalysisJobsModel(dict(
                    modelId=self._model_id,
                    pipelineId=pipeline.id,
                    previousJobId=apply_model_layout_job.job_id,
                ))
        self._save_job_with_stage(topology_analysis_job, session)

    def _add_reshape_related_jobs(self, pipeline: PipelineModel, session: Session) -> int:
        model_shape_configuration_model = ModelShapeConfigurationModel(
            model_id=self._model_id,
            shape_configuration=self._shape_configuration,
            is_original=False
        )
        model_shape_configuration_model.write_record(session=session)

        create_script_job_data = JobData(
            pipelineId=pipeline.id,
            projectId=None,
            previousJobId=None
        )
        create_scripts_job = CreateReshapeModelScriptsJobModel(create_script_job_data)
        self._save_job_with_stage(create_scripts_job, session=session)

        reshape_job_data = ReshapeModelJobData(
            pipelineId=pipeline.id,
            projectId=None,
            previousJobId=create_scripts_job.job_id,
            model_id=self._model_id,
            shape_model_configuration_id=model_shape_configuration_model.id,
            save_reshaped_model=self._save_model
        )
        reshape_model_job = ReshapeModelJobModel(reshape_job_data)
        self._save_job_with_stage(reshape_model_job, session=session)
        return reshape_model_job.job_id
