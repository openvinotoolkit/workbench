"""
 OpenVINO DL Workbench
 Class for creating ORM setup pipeline model and dependent models

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
import os

from sqlalchemy.orm import Session

from config.constants import WORKBENCH_HIDDEN_FOLDER, ROOT_TMP_FOLDER
from wb.extensions_factories.database import get_db_session_for_app
from wb.main.models import (CreateSetupBundleJobModel, PipelineModel, SetupTargetJobsModel,
                            UploadArtifactToTargetJobModel, TargetModel)
from wb.main.enumerates import PipelineTypeEnum, PipelineStageEnum, DeploymentTargetEnum
from wb.main.pipeline_creators.deployment_manager_pipeline_creator import DeploymentManagerPipelineCreator
from wb.main.pipeline_creators.ping_pipeline_creator import PingPipelineCreator
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator


class SetupPipelineCreator(PipelineCreator):
    pipeline_type = PipelineTypeEnum.setup

    _job_type_to_stage_map = {
        CreateSetupBundleJobModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_setup_assets,
        UploadArtifactToTargetJobModel.get_polymorphic_job_type(): PipelineStageEnum.uploading_setup_assets,
        SetupTargetJobsModel.get_polymorphic_job_type(): PipelineStageEnum.configuring_environment,
    }

    @classmethod
    def get_setup_bundle_configuration(cls, pipeline_id: int, target: TargetModel) -> dict:
        return {
            'targets': DeploymentTargetEnum.values(),
            'targetId': target.id,
            'pipelineId': pipeline_id,
            'includeModel': False,
            'setupScript': True,
            'getDevicesScript': True,
            'getResourcesScript': True,
            'edgeNodeSetupScript': True,
            'operatingSystem': target.operating_system
        }

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        configuration = self.get_setup_bundle_configuration(pipeline_id=pipeline.id,
                                                            target=pipeline.target)
        create_setup_bundle_job, _, deployment_bundle = \
            DeploymentManagerPipelineCreator.fill_db_before_deployment_pipeline(configuration, get_db_session_for_app())
        self._save_job_with_stage(create_setup_bundle_job, session)

        upload_artifact_to_target_job = UploadArtifactToTargetJobModel({
            'artifactId': deployment_bundle.id,
            'targetId': pipeline.target_id,
            'pipelineId': pipeline.id,
            'previousJobId': create_setup_bundle_job.job_id,
            'destinationDirectory': os.path.join(ROOT_TMP_FOLDER, WORKBENCH_HIDDEN_FOLDER),
        })
        self._save_job_with_stage(upload_artifact_to_target_job, session)

        setup_job = SetupTargetJobsModel({
            'targetId': configuration['targetId'],
            'pipelineId': configuration['pipelineId'],
            'previousJobId': create_setup_bundle_job.job_id,
            'setupBundlePath': os.path.join(ROOT_TMP_FOLDER, WORKBENCH_HIDDEN_FOLDER)
        })
        self._save_job_with_stage(setup_job, session)

        # Add ping pipeline jobs as next celery tasks
        ping_pipeline_creator = PingPipelineCreator(self._target_id)
        ping_pipeline_creator.create()
        self.created_jobs.extend(ping_pipeline_creator.created_jobs)
