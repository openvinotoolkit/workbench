"""
 OpenVINO DL Workbench
 Class for creating jobs for accuracy jobs in DevCloud

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

from wb.main.enumerates import (JobTypesEnum, PipelineTypeEnum, PipelineStageEnum, ArtifactTypesEnum,
                                DevCloudRemoteJobTypeEnum, AccuracyReportTypeEnum)
from wb.main.models import (CreateAccuracyScriptsJobModel, CreateAccuracyBundleJobModel, AccuracyJobsModel,
                            ProjectsModel, ParseDevCloudResultJobData, DownloadableArtifactsModel,
                            ParseDevCloudAccuracyResultJobModel, PipelineModel, TriggerDevCloudJobModel)
from wb.main.models.accuracy_model import AccuracyJobData
from wb.main.models.jobs_model import JobData
from wb.main.models.trigger_dev_cloud_job_model import TriggerDevCloudJobData
from wb.main.pipeline_creators.dev_cloud_pipeline_creator_utils import DevCloudPipelineCreator


class DevCloudAccuracyPipelineCreator(DevCloudPipelineCreator):
    pipeline_type = PipelineTypeEnum.dev_cloud_accuracy

    _job_type_to_stage_map = {
        **DevCloudPipelineCreator._job_type_to_stage_map,
        CreateAccuracyScriptsJobModel.get_polymorphic_job_type():
            PipelineStageEnum.preparing_accuracy_assets,
        CreateAccuracyBundleJobModel.get_polymorphic_job_type():
            PipelineStageEnum.preparing_accuracy_assets,
        TriggerDevCloudJobModel.get_polymorphic_job_type():
            PipelineStageEnum.uploading_setup_assets,
        AccuracyJobsModel.get_polymorphic_job_type():
            PipelineStageEnum.accuracy,
        ParseDevCloudAccuracyResultJobModel.get_polymorphic_job_type():
            PipelineStageEnum.accuracy,
    }
    _specific_job_model_to_job_type_map = {
        AccuracyJobsModel.get_polymorphic_job_type():
            JobTypesEnum.handle_dev_cloud_accuracy_sockets_job.value,
    }

    def __init__(self, project_id: int, target_id: int):
        super().__init__(target_id=target_id)
        self._project_id = project_id

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        project: ProjectsModel = ProjectsModel.query.get(self._project_id)
        target_dataset_id = project.dataset_id

        previous_job_id, deployment_bundle_id = self._add_deployment_and_setup_bundle_jobs(pipeline_id=pipeline.id,
                                                                                           target=pipeline.target,
                                                                                           project_id=self._project_id,
                                                                                           session=session)

        create_accuracy_scripts_job_data = JobData(
            projectId=self._project_id,
            pipelineId=pipeline.id,
            previousJobId=previous_job_id
        )

        create_accuracy_scripts_job = CreateAccuracyScriptsJobModel(create_accuracy_scripts_job_data)
        self._save_job_with_stage(create_accuracy_scripts_job, session)

        accuracy_bundle = DownloadableArtifactsModel(ArtifactTypesEnum.job_bundle)
        accuracy_bundle.write_record(session)
        create_job_bundle_job = CreateAccuracyBundleJobModel({
            'projectId': self._project_id,
            'bundleId': accuracy_bundle.id,
            'previousJobId': create_accuracy_scripts_job.job_id,
            'pipelineId': pipeline.id,
        })
        self._save_job_with_stage(create_job_bundle_job, session)

        trigger_dev_cloud_profiling_job_data = TriggerDevCloudJobData(
            projectId=self._project_id,
            pipelineId=pipeline.id,
            previousJobId=create_job_bundle_job.job_id,
            setupBundleId=deployment_bundle_id,
            jobBundleId=accuracy_bundle.id,
            remoteJobType=DevCloudRemoteJobTypeEnum.accuracy
        )

        trigger_dev_cloud_profiling_job = TriggerDevCloudJobModel(trigger_dev_cloud_profiling_job_data)
        self._save_job_with_stage(trigger_dev_cloud_profiling_job, session)

        accuracy_job_data = AccuracyJobData(targetDatasetId=target_dataset_id,
                                            reportType=AccuracyReportTypeEnum.dataset_annotations,
                                            projectId=self._project_id,
                                            pipelineId=pipeline.id,
                                            previousJobId=trigger_dev_cloud_profiling_job.job_id)
        job = AccuracyJobsModel(accuracy_job_data)
        self._save_job_with_stage(job, session)
        remote_job_result_artifact = self._create_result_artifact(session)

        parse_profiling_result_data = ParseDevCloudResultJobData(
            projectId=self._project_id,
            pipelineId=pipeline.id,
            previousJobId=job.job_id,
            resultArtifactId=remote_job_result_artifact.id,
        )
        parse_profiling_result_job = ParseDevCloudAccuracyResultJobModel(parse_profiling_result_data)
        self._save_job_with_stage(parse_profiling_result_job, session)
