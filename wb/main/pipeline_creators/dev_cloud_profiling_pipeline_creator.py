"""
 OpenVINO DL Workbench
 Class for creating sutup and profiling bundles for DevCloud job

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

from sqlalchemy.orm import Session

from wb.main.enumerates import JobTypesEnum, PipelineTypeEnum, PipelineStageEnum, ArtifactTypesEnum, \
    DevCloudRemoteJobTypeEnum
from wb.main.models import CreateProfilingScriptsJobModel
from wb.main.models.profiling_model import ProfilingJobModel
from wb.main.models.create_profiling_bundle_job_model import CreateProfilingBundleJobModel
from wb.main.models.downloadable_artifacts_model import DownloadableArtifactsModel
from wb.main.models.parse_dev_cloud_profiling_result_job_model import ParseDevCloudProfilingResultJobModel
from wb.main.models.parse_dev_cloud_result_job_model import ParseDevCloudResultJobData
from wb.main.models.pipeline_model import PipelineModel
from wb.main.models.trigger_dev_cloud_job_model import TriggerDevCloudJobModel, TriggerDevCloudJobData
from wb.main.pipeline_creators.dev_cloud_pipeline_creator_utils import DevCloudPipelineCreator
from wb.main.pipeline_creators.profiling_pipeline_creator import ProfilingPipelineCreator


class DevCloudProfilingPipelineCreator(ProfilingPipelineCreator, DevCloudPipelineCreator):
    pipeline_type = PipelineTypeEnum.dev_cloud_profiling

    _job_type_to_stage_map = {
        **DevCloudPipelineCreator._job_type_to_stage_map,
        CreateProfilingScriptsJobModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_profiling_assets,
        CreateProfilingBundleJobModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_profiling_assets,
        TriggerDevCloudJobModel.get_polymorphic_job_type(): PipelineStageEnum.uploading_setup_assets,
        # pylint: disable=fixme
        # TODO Add another job with 'uploading' stage for getting setup and profile bundle archives form DL WB
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

        if self.configuration.get('setupBundleId') is None:
            previous_job_id, deployment_bundle_id = self._add_deployment_and_setup_bundle_jobs(pipeline_id=pipeline_id,
                                                                                               target=pipeline.target,
                                                                                               project_id=project_id,
                                                                                               session=session)
        else:
            previous_job_id = self.configuration.get('previousJobId')
            deployment_bundle_id = self.configuration['setupBundleId']
        create_profiling_scripts_job = CreateProfilingScriptsJobModel({
            'projectId': self.project_id,
            'previousJobId': previous_job_id,
            'pipelineId': pipeline_id,
        })
        self._save_job_with_stage(create_profiling_scripts_job, session)
        previous_job_id = create_profiling_scripts_job.job_id

        profiling_bundle = DownloadableArtifactsModel(ArtifactTypesEnum.job_bundle)
        profiling_bundle.write_record(session)

        create_profiling_bundle_job = CreateProfilingBundleJobModel({
            'projectId': self.project_id,
            'bundleId': profiling_bundle.id,
            'previousJobId': previous_job_id,
            'pipelineId': pipeline_id,
        })
        self._save_job_with_stage(create_profiling_bundle_job, session)
        previous_job_id = create_profiling_bundle_job.job_id

        trigger_dev_cloud_profiling_job_data = TriggerDevCloudJobData(
            projectId=self.project_id,
            pipelineId=pipeline_id,
            previousJobId=previous_job_id,
            setupBundleId=deployment_bundle_id,
            jobBundleId=profiling_bundle.id,
            remoteJobType=DevCloudRemoteJobTypeEnum.profiling
        )

        trigger_dev_cloud_profiling_job = TriggerDevCloudJobModel(trigger_dev_cloud_profiling_job_data)
        self._save_job_with_stage(trigger_dev_cloud_profiling_job, session)
        previous_job_id = trigger_dev_cloud_profiling_job.job_id
        profiling_job = self.create_profiling_job(previous_job_id=previous_job_id, session=session)

        # Create DevCloud profiling result artifact model for further upload
        remote_job_result_artifact = self._create_result_artifact(session)

        # Create job model for parsing DevCloud profiling result
        parse_profiling_result_data = ParseDevCloudResultJobData(
            projectId=self.project_id,
            pipelineId=pipeline_id,
            previousJobId=profiling_job.job_id,
            resultArtifactId=remote_job_result_artifact.id)
        parse_profiling_result_job = ParseDevCloudProfilingResultJobModel(parse_profiling_result_data)
        self._save_job_with_stage(parse_profiling_result_job, session)
