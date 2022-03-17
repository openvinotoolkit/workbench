"""
 OpenVINO DL Workbench
 Class for creating jobs for int8 calibration jobs in DevCloud

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

from wb.main.enumerates import (JobTypesEnum, PipelineTypeEnum, PipelineStageEnum, ArtifactTypesEnum,
                                OptimizationTypesEnum, DevCloudRemoteJobTypeEnum)
from wb.main.models import (CreateInt8CalibrationScriptsJobModel, CreateInt8CalibrationBundleJobModel,
                            DownloadableArtifactsModel, Int8CalibrationJobModel,
                            ParseDevCloudInt8CalibrationResultJobModel, PipelineModel, TopologyAnalysisJobsModel,
                            TriggerDevCloudJobModel)
from wb.main.models.parse_dev_cloud_int8_calibration_result_job_model import ParseDevCloudInt8CalibrationResultJobData
from wb.main.models.trigger_dev_cloud_job_model import TriggerDevCloudJobData
from wb.main.pipeline_creators.dev_cloud_pipeline_creator_utils import DevCloudPipelineCreator
from wb.main.pipeline_creators.dev_cloud_profiling_pipeline_creator import DevCloudProfilingPipelineCreator
from wb.main.pipeline_creators.int8_calibration_pipeline_creator import Int8CalibrationPipelineCreator


class DevCloudInt8CalibrationPipelineCreator(Int8CalibrationPipelineCreator, DevCloudPipelineCreator):
    pipeline_type = PipelineTypeEnum.dev_cloud_int8_calibration

    _job_type_to_stage_map = {
        **DevCloudPipelineCreator._job_type_to_stage_map,
        CreateInt8CalibrationScriptsJobModel.get_polymorphic_job_type():
            PipelineStageEnum.preparing_int8_calibration_assets,
        CreateInt8CalibrationBundleJobModel.get_polymorphic_job_type():
            PipelineStageEnum.preparing_int8_calibration_assets,
        TriggerDevCloudJobModel.get_polymorphic_job_type():
            PipelineStageEnum.uploading_setup_assets,
        Int8CalibrationJobModel.get_polymorphic_job_type():
            PipelineStageEnum.int8_calibration,
        ParseDevCloudInt8CalibrationResultJobModel.get_polymorphic_job_type():
            PipelineStageEnum.getting_remote_job_result,
        TopologyAnalysisJobsModel.get_polymorphic_job_type(): PipelineStageEnum.model_analyzer,
    }
    _specific_job_model_to_job_type_map = {
        Int8CalibrationJobModel.get_polymorphic_job_type():
            JobTypesEnum.handle_dev_cloud_int8_calibration_sockets_job.value,
        **DevCloudProfilingPipelineCreator.get_specific_job_models_to_job_type()
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

        previous_job_id, deployment_bundle_id = self._add_deployment_and_setup_bundle_jobs(pipeline_id=pipeline.id,
                                                                                           target=pipeline.target,
                                                                                           project_id=int8_project_id,
                                                                                           session=session)

        self.optimization_configuration['previousJobId'] = previous_job_id
        create_int8_calibration_scripts_job = CreateInt8CalibrationScriptsJobModel(self.optimization_configuration)
        self._save_job_with_stage(create_int8_calibration_scripts_job, session)
        calibration_bundle = DownloadableArtifactsModel(ArtifactTypesEnum.job_bundle)
        calibration_bundle.write_record(session)
        create_job_bundle_job = CreateInt8CalibrationBundleJobModel({
            'projectId': int8_project_id,
            'bundleId': calibration_bundle.id,
            'previousJobId': create_int8_calibration_scripts_job.job_id,
            'pipelineId': pipeline.id,
        })
        self._save_job_with_stage(create_job_bundle_job, session)
        previous_job_id = create_job_bundle_job.job_id

        trigger_dev_cloud_profiling_job_data = TriggerDevCloudJobData(
            projectId=int8_project_id,
            pipelineId=pipeline.id,
            previousJobId=previous_job_id,
            setupBundleId=deployment_bundle_id,
            jobBundleId=calibration_bundle.id,
            remoteJobType=DevCloudRemoteJobTypeEnum.calibration
        )

        trigger_dev_cloud_profiling_job = TriggerDevCloudJobModel(trigger_dev_cloud_profiling_job_data)
        self._save_job_with_stage(trigger_dev_cloud_profiling_job, session)

        self.optimization_configuration['previousJobId'] = trigger_dev_cloud_profiling_job.job_id

        int8_job = self._create_int8_job(pipeline_id=pipeline.id, int8_model_id=int8_model.id, session=session)
        self._set_optimized_model_path(optimized_model=int8_model, optimization_job_id=int8_job.job_id, session=session)
        self._set_optimized_project_ac_config(self.optimization_configuration['projectId'], session)

        self.profiling_configuration['modelId'] = int8_model.id
        self.profiling_configuration['pipelineId'] = pipeline.id
        self.profiling_configuration['setupBundleId'] = deployment_bundle_id

        # Create DevCloud int8 calibration result artifact model for further upload
        remote_job_result_artifact = self._create_result_artifact(session)

        # Create job model for parsing DevCloud int8 calibration result
        parse_profiling_result_data = ParseDevCloudInt8CalibrationResultJobData(
            projectId=int8_project_id,
            pipelineId=pipeline.id,
            previousJobId=int8_job.job_id,
            resultArtifactId=remote_job_result_artifact.id,
            int8ModelId=int8_model.id
        )
        parse_profiling_result_job = ParseDevCloudInt8CalibrationResultJobModel(parse_profiling_result_data)
        self._save_job_with_stage(parse_profiling_result_job, session)
        topology_analysis_job = self._create_topology_analysis_job(pipeline, int8_model, int8_job, session)

        self.profiling_configuration['previousJobId'] = topology_analysis_job.job_id
        self.create_project_and_save_to_configuration(configuration=self.profiling_configuration,
                                                      optimization_type=OptimizationTypesEnum.int8calibration,
                                                      session=session)
        profiling_pipeline_creator = DevCloudProfilingPipelineCreator(self.profiling_configuration)
        profiling_pipeline_creator.create()
        self.created_jobs.extend(profiling_pipeline_creator.created_jobs)
