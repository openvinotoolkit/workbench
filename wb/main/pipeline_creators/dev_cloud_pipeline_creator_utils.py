"""
 OpenVINO DL Workbench
 Class for common functionality of DevCloud pipelines

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
from typing import Tuple

from sqlalchemy.orm import Session

from config.constants import UPLOADS_FOLDER
from wb.main.enumerates import ArtifactTypesEnum, PipelineStageEnum
from wb.main.models import CreateSetupBundleJobModel, DownloadableArtifactsModel, TargetModel
from wb.main.pipeline_creators.deployment_manager_pipeline_creator import DeploymentManagerPipelineCreator
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator
from wb.main.pipeline_creators.setup_pipeline_creator import SetupPipelineCreator


class DevCloudPipelineCreator(PipelineCreator):
    _job_type_to_stage_map = {
        CreateSetupBundleJobModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_setup_assets,
    }

    def _add_deployment_and_setup_bundle_jobs(self, pipeline_id: int,
                                              target: TargetModel,
                                              project_id: int,
                                              session: Session) -> Tuple[int, int]:
        deployment_configuration = SetupPipelineCreator.get_setup_bundle_configuration(pipeline_id, target)
        if project_id:
            deployment_configuration['projectId'] = project_id

        create_setup_bundle_job, _, deployment_bundle = \
            DeploymentManagerPipelineCreator.fill_db_before_deployment_pipeline(deployment_configuration, session)
        self._save_job_with_stage(create_setup_bundle_job, session)
        return create_setup_bundle_job.job_id, deployment_bundle.id

    @staticmethod
    def _create_result_artifact(session: Session) -> DownloadableArtifactsModel:
        remote_job_result_artifact = DownloadableArtifactsModel(artifact_type=ArtifactTypesEnum.remote_job_result)
        remote_job_result_artifact.write_record(session)
        remote_job_result_artifact.path = os.path.join(UPLOADS_FOLDER, str(remote_job_result_artifact.id))
        remote_job_result_artifact.write_record(session)
        return remote_job_result_artifact
