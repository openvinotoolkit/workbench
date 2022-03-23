"""
 OpenVINO DL Workbench
 Class for creating ORM remote profiling pipeline model and dependent models

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
from wb.main.models import CreateProfilingScriptsJobModel
from wb.main.models.profiling_model import ProfilingJobModel
from wb.main.models.create_profiling_bundle_job_model import CreateProfilingBundleJobModel
from wb.main.models.pipeline_model import PipelineModel
from wb.main.models.upload_artifact_to_target_job_model import UploadArtifactToTargetJobModel
from wb.main.pipeline_creators.profiling_pipeline_creator import ProfilingPipelineCreator


class RemoteProfilingPipelineCreator(ProfilingPipelineCreator):
    pipeline_type = PipelineTypeEnum.remote_profiling

    _job_type_to_stage_map = {
        CreateProfilingScriptsJobModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_profiling_assets,
        CreateProfilingBundleJobModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_profiling_assets,
        UploadArtifactToTargetJobModel.get_polymorphic_job_type(): PipelineStageEnum.uploading_setup_assets,
        ProfilingJobModel.get_polymorphic_job_type(): PipelineStageEnum.profiling,
    }
    _specific_job_model_to_job_type_map = {
        ProfilingJobModel.get_polymorphic_job_type(): JobTypesEnum.remote_profiling_type.value
    }

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        project_id = self.create_project_and_save_to_configuration(configuration=self.configuration,
                                                                   optimization_type=OptimizationTypesEnum.inference,
                                                                   session=session)
        self.configuration['projectId'] = project_id
        if 'pipelineId' not in self.configuration:
            self.configuration['pipelineId'] = pipeline.id
        create_profiling_scripts_job = CreateProfilingScriptsJobModel(self.configuration)
        self._save_job_with_stage(create_profiling_scripts_job, session)

        previous_job_id = self._create_pipeline_jobs_for_uploading_bundle(
            pipeline_id=self.configuration['pipelineId'],
            target_id=self.configuration['targetId'],
            project_id=project_id,
            previous_job=create_profiling_scripts_job.job_id,
            create_job_bundle_model_class=CreateProfilingBundleJobModel,
            session=session
        )
        self.create_profiling_job(previous_job_id=previous_job_id, session=session)
