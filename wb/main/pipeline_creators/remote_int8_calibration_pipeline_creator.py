"""
 OpenVINO DL Workbench
 Class for creating ORM local int8 calibration pipeline model and dependent models

 Copyright (c) 2020 Intel Corporation

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

from sqlalchemy.orm import Session

from wb.main.enumerates import JobTypesEnum, PipelineTypeEnum, PipelineStageEnum, OptimizationTypesEnum
from wb.main.models import (CreateInt8CalibrationScriptsJobModel, CreateInt8CalibrationBundleJobModel,
                            Int8CalibrationJobModel, PipelineModel, TopologyAnalysisJobsModel,
                            UploadArtifactToTargetJobModel)
from wb.main.pipeline_creators.int8_calibration_pipeline_creator import Int8CalibrationPipelineCreator
from wb.main.pipeline_creators.remote_profiling_pipeline_creator import RemoteProfilingPipelineCreator


class RemoteInt8CalibrationPipelineCreator(Int8CalibrationPipelineCreator):
    pipeline_type = PipelineTypeEnum.remote_int8_calibration

    _job_type_to_stage_map = {
        CreateInt8CalibrationScriptsJobModel.get_polymorphic_job_type():
            PipelineStageEnum.preparing_int8_calibration_assets,
        CreateInt8CalibrationBundleJobModel.get_polymorphic_job_type():
            PipelineStageEnum.preparing_int8_calibration_assets,
        UploadArtifactToTargetJobModel.get_polymorphic_job_type():
            PipelineStageEnum.uploading_setup_assets,
        Int8CalibrationJobModel.get_polymorphic_job_type(): PipelineStageEnum.int8_calibration,
        TopologyAnalysisJobsModel.get_polymorphic_job_type(): PipelineStageEnum.model_analyzer,
    }
    _specific_job_model_to_job_type_map = {
        Int8CalibrationJobModel.get_polymorphic_job_type(): JobTypesEnum.remote_int8_calibration_type.value,
        **RemoteProfilingPipelineCreator.get_specific_job_models_to_job_type()
    }

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        int8_model = self._create_optimized_model(session=session)

        optimized_project_configuration = {
            **self.optimization_configuration,
            'modelId': int8_model.id,
            'datasetId': self.profiling_configuration['datasetId']
        }

        int8_project_id = self.create_project_and_save_to_configuration(
            configuration=optimized_project_configuration,
            optimization_type=OptimizationTypesEnum.int8calibration,
            session=session
        )
        self.optimization_configuration['projectId'] = int8_project_id
        self.optimization_configuration['pipelineId'] = pipeline.id
        create_int8_calibration_scripts_job = CreateInt8CalibrationScriptsJobModel(self.optimization_configuration)
        self._save_job_with_stage(create_int8_calibration_scripts_job, session)
        self.optimization_configuration['previousJobId'] = create_int8_calibration_scripts_job.job_id
        upload_artifact_job_id = self._create_pipeline_jobs_for_uploading_bundle(
            pipeline_id=pipeline.id,
            target_id=pipeline.target_id,
            project_id=int8_project_id,
            create_job_bundle_model_class=CreateInt8CalibrationBundleJobModel,
            session=session
        )
        self.optimization_configuration['previousJobId'] = upload_artifact_job_id

        int8_model_id, last_job_id = self._create_int8_pipeline_jobs(int8_model=int8_model, pipeline=pipeline,
                                                                     session=session)
        self.profiling_configuration['modelId'] = int8_model_id
        self.profiling_configuration['pipelineId'] = pipeline.id
        self.profiling_configuration['previousJobId'] = last_job_id
        self.profiling_configuration['targetId'] = pipeline.target_id
        self.create_project_and_save_to_configuration(configuration=self.profiling_configuration,
                                                      optimization_type=OptimizationTypesEnum.int8calibration,
                                                      session=session)
        profiling_pipeline_creator = RemoteProfilingPipelineCreator(self.profiling_configuration)
        profiling_pipeline_creator.create()
        self.created_jobs.extend(profiling_pipeline_creator.created_jobs)
