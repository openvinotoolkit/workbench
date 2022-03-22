"""
 OpenVINO DL Workbench
 Class for creating ORM local profiling pipeline model and dependent models

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

from wb.main.enumerates import PipelineTypeEnum, PipelineStageEnum
from wb.main.models import CreateProfilingScriptsJobModel, PipelineModel, ProfilingJobModel
from wb.main.pipeline_creators.profiling_pipeline_creator import ProfilingPipelineCreator


class LocalProfilingPipelineCreator(ProfilingPipelineCreator):
    pipeline_type = PipelineTypeEnum.local_profiling

    _job_type_to_stage_map = {
        CreateProfilingScriptsJobModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_profiling_assets,
        ProfilingJobModel.get_polymorphic_job_type(): PipelineStageEnum.profiling,
    }

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        project_id = self.create_project_and_save_to_configuration(configuration=self.configuration,
                                                                   session=session)
        self.configuration['projectId'] = project_id
        if 'pipelineId' not in self.configuration:
            self.configuration['pipelineId'] = pipeline.id
        create_profiling_scripts_job = CreateProfilingScriptsJobModel(self.configuration)
        self._save_job_with_stage(create_profiling_scripts_job, session)
        self.create_profiling_job(previous_job_id=create_profiling_scripts_job.job_id,
                                  session=session)
