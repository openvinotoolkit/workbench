"""
 OpenVINO DL Workbench
 Class for creating ORM deployment manager pipeline model and dependent models

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
from typing import Type

from sqlalchemy.orm import Session

from wb.main.enumerates import PipelineTypeEnum, PipelineStageEnum, ArtifactTypesEnum, DeploymentTargetEnum
from wb.main.models import ArtifactsModel
from wb.main.models.create_setup_bundle_job_model import CreateSetupBundleJobModel
from wb.main.models.deployment_bundle_config_model import DeploymentBundleConfigModel, DeploymentTargetsModel
from wb.main.models.downloadable_artifacts_model import DownloadableArtifactsModel
from wb.main.models.pipeline_model import PipelineModel
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator


class DeploymentManagerPipelineCreator(PipelineCreator):
    pipeline_type = PipelineTypeEnum.deployment_manager

    _job_type_to_stage_map = {
        CreateSetupBundleJobModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_setup_assets,
    }

    def __init__(self, target_id: int, configuration: dict):
        super().__init__(target_id)
        self.configuration = configuration

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        self.configuration['pipelineId'] = pipeline.id
        self.configuration['targetId'] = pipeline.target_id

        create_setup_bundle_job, _ = (
            self.fill_db_before_deployment_pipeline(self.configuration,
                                                    session,
                                                    DownloadableArtifactsModel)
        )
        self._save_job_with_stage(create_setup_bundle_job, session)

    @staticmethod
    def fill_db_before_deployment_pipeline(configuration: dict,
                                           session: Session,
                                           artifact_model_type: Type[ArtifactsModel] = DownloadableArtifactsModel) -> tuple:
        deployment_bundle = artifact_model_type(ArtifactTypesEnum.deployment_package)
        deployment_bundle.write_record(session)

        deployment_bundle_config = DeploymentBundleConfigModel(configuration, deployment_bundle.id)
        deployment_bundle_config.write_record(session)

        for target in configuration['targets']:
            deployment_target_model = DeploymentTargetsModel(deployment_bundle_config, DeploymentTargetEnum(target))
            deployment_target_model.write_record(session)

        create_setup_bundle_job = CreateSetupBundleJobModel({
            'projectId': configuration.get('projectId'),
            'previousJobId': configuration.get('previousJobId'),
            'pipelineId': configuration.get('pipelineId'),
            'tabId': configuration.get('tabId'),
            'deploymentBundleConfigId': deployment_bundle_config.id,
        })
        create_setup_bundle_job.write_record(session)

        return create_setup_bundle_job, deployment_bundle
