"""
 OpenVINO DL Workbench
 Class for common functionality of DevCloud pipelines

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
