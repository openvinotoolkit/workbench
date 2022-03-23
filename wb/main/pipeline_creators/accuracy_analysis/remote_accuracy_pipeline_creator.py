"""
 OpenVINO DL Workbench
 Class for creating ORM accuracy pipeline model and dependent models

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
from sqlalchemy.orm import Session

from wb.main.enumerates import PipelineTypeEnum, PipelineStageEnum, JobTypesEnum, AccuracyReportTypeEnum
from wb.main.models import (TargetModel, AccuracyJobsModel, PipelineModel, ProjectsModel,
                            UploadArtifactToTargetJobModel, CreateAccuracyBundleJobModel, CreateAccuracyScriptsJobModel)
from wb.main.models.accuracy_model import AccuracyJobData
from wb.main.models.jobs_model import JobData
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator


class RemoteAccuracyPipelineCreator(PipelineCreator):
    pipeline_type = PipelineTypeEnum.remote_accuracy

    _job_type_to_stage_map = {
        CreateAccuracyScriptsJobModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_accuracy_assets,
        CreateAccuracyBundleJobModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_accuracy_assets,
        UploadArtifactToTargetJobModel.get_polymorphic_job_type(): PipelineStageEnum.uploading_setup_assets,
        AccuracyJobsModel.get_polymorphic_job_type(): PipelineStageEnum.accuracy,
    }
    _specific_job_model_to_job_type_map = {
        AccuracyJobsModel.get_polymorphic_job_type(): JobTypesEnum.remote_accuracy_type.value
    }

    def __init__(self, project_id: int, target_id: int):
        remote_target_model = TargetModel.query.get(target_id)
        super().__init__(target_id=remote_target_model.id)
        self.project_id = project_id

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        project: ProjectsModel = ProjectsModel.query.get(self.project_id)
        target_dataset_id = project.dataset_id
        create_accuracy_scripts_job_data = JobData(
            projectId=self.project_id,
            pipelineId=pipeline.id,
            previousJobId=None)
        create_accuracy_scripts_job = CreateAccuracyScriptsJobModel(create_accuracy_scripts_job_data)
        self._save_job_with_stage(create_accuracy_scripts_job, session)

        previous_job_id = self._create_pipeline_jobs_for_uploading_bundle(
            pipeline_id=pipeline.id,
            target_id=self._target_id,
            project_id=self.project_id,
            previous_job=create_accuracy_scripts_job.job_id,
            create_job_bundle_model_class=CreateAccuracyBundleJobModel,
            session=session
        )
        accuracy_job_data = AccuracyJobData(targetDatasetId=target_dataset_id,
                                            reportType=AccuracyReportTypeEnum.dataset_annotations,
                                            projectId=self.project_id,
                                            pipelineId=pipeline.id,
                                            previousJobId=previous_job_id)
        job = AccuracyJobsModel(accuracy_job_data)
        self._save_job_with_stage(job, session)
