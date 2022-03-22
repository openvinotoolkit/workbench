"""
 OpenVINO DL Workbench
 Class for creating sutup and profiling bundles for DevCloud job

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

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from wb.main.enumerates import (JobTypesEnum, PipelineTypeEnum, PipelineStageEnum, ArtifactTypesEnum,
                                DevCloudRemoteJobTypeEnum, StatusEnum)
from wb.main.models import CreateProfilingScriptsJobModel, CloudBundleModel
from wb.main.models.jobs_model import JobData
from wb.main.models import (ProfilingJobModel, CreateProfilingBundleJobModel, ParseDevCloudProfilingResultJobModel,
                            PipelineModel, TriggerDevCloudJobModel)
from wb.main.models.trigger_dev_cloud_job_model import TriggerDevCloudJobData
from wb.main.pipeline_creators.dev_cloud_pipeline_creator_utils import DevCloudPipelineCreator
from wb.main.pipeline_creators.profiling_pipeline_creator import ProfilingPipelineCreator


class DevCloudProfilingPipelineCreator(ProfilingPipelineCreator, DevCloudPipelineCreator):
    pipeline_type = PipelineTypeEnum.dev_cloud_profiling

    _job_type_to_stage_map = {
        **DevCloudPipelineCreator._job_type_to_stage_map,
        CreateProfilingScriptsJobModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_profiling_assets,
        CreateProfilingBundleJobModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_profiling_assets,
        TriggerDevCloudJobModel.get_polymorphic_job_type(): PipelineStageEnum.uploading_setup_assets,
        ProfilingJobModel.get_polymorphic_job_type(): PipelineStageEnum.profiling,
        ParseDevCloudProfilingResultJobModel.get_polymorphic_job_type(): PipelineStageEnum.getting_remote_job_result,
    }
    _specific_job_model_to_job_type_map = {
        ProfilingJobModel.get_polymorphic_job_type():
            JobTypesEnum.handle_dev_cloud_profiling_sockets_job.value,
    }

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        project_id = self.create_project_and_save_to_configuration(configuration=self.configuration,
                                                                   session=session)
        pipeline_id = self.configuration.get('pipelineId', pipeline.id)

        self.configuration['pipelineId'] = pipeline_id
        self.configuration['projectId'] = project_id
        previous_job_id = self.configuration.get('previousJobId')

        setup_bundle = session.query(CloudBundleModel).filter(
            and_(
                CloudBundleModel.artifact_type == ArtifactTypesEnum.deployment_package,
                or_(
                    CloudBundleModel.status == StatusEnum.ready,  # Ready bundle from previous pipelines
                    CloudBundleModel.job.has(pipeline_id=pipeline_id)  # Bundle from the same pipeline
                )
            )
        ).first()

        if not setup_bundle or (setup_bundle.status == StatusEnum.ready and not setup_bundle.bundle_exists):
            previous_job_id, deployment_bundle_id = self._create_setup_bundle_job_and_artifact(
                pipeline_id=pipeline_id,
                target=pipeline.target,
                project_id=project_id,
                session=session,
                artifact_model_type=CloudBundleModel
            )
            setup_bundle = session.query(CloudBundleModel).get(deployment_bundle_id)

        create_profiling_scripts_job = CreateProfilingScriptsJobModel({
            'projectId': self.project_id,
            'previousJobId': previous_job_id,
            'pipelineId': pipeline_id,
        })
        self._save_job_with_stage(create_profiling_scripts_job, session)
        previous_job_id = create_profiling_scripts_job.job_id

        create_profiling_bundle_job = CreateProfilingBundleJobModel({
            'projectId': self.project_id,
            'previousJobId': previous_job_id,
            'pipelineId': pipeline_id,
        })
        self._save_job_with_stage(create_profiling_bundle_job, session)
        previous_job_id = create_profiling_bundle_job.job_id

        profiling_bundle = CloudBundleModel(ArtifactTypesEnum.job_bundle, job_id=previous_job_id)
        profiling_bundle.write_record(session)

        trigger_dev_cloud_profiling_job_data = TriggerDevCloudJobData(
            projectId=self.project_id,
            pipelineId=pipeline_id,
            previousJobId=previous_job_id,
            setupBundleId=setup_bundle.id,
            jobBundleId=profiling_bundle.id,
            remoteJobType=DevCloudRemoteJobTypeEnum.profiling,
        )

        trigger_dev_cloud_profiling_job = TriggerDevCloudJobModel(trigger_dev_cloud_profiling_job_data)
        self._save_job_with_stage(trigger_dev_cloud_profiling_job, session)
        previous_job_id = trigger_dev_cloud_profiling_job.job_id
        profiling_job = self.create_profiling_job(previous_job_id=previous_job_id, session=session)

        # Create DevCloud profiling result artifact model for further upload

        # Create job model for parsing DevCloud profiling result
        parse_profiling_result_data = JobData(
            projectId=self.project_id,
            pipelineId=pipeline_id,
            previousJobId=profiling_job.job_id,

        )
        parse_profiling_result_job = ParseDevCloudProfilingResultJobModel(parse_profiling_result_data)
        self._save_job_with_stage(parse_profiling_result_job, session)
