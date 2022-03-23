"""
 OpenVINO DL Workbench
 Class for triggering job in the DevCloud service

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
import logging as log
from contextlib import closing
from pathlib import Path

from sqlalchemy.orm import Session

from config.constants import CLOUD_SHARED_FOLDER
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.enumerates import JobTypesEnum, StatusEnum, DevCloudRemoteJobTypeEnum
from wb.main.models import ProjectsModel, TriggerDevCloudJobModel
from wb.main.utils.dev_cloud_http_service import (TriggerNetworkRemotePipelinePayload,
                                                  TriggerSharedFolderRemoteJobPayload,
                                                  DevCloudHttpService)


class TriggerDevCloudJob(IJob):
    job_type = JobTypesEnum.trigger_dev_cloud_job
    _job_model_class = TriggerDevCloudJobModel

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, log='Starting trigger DevCloud job')
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job_model: TriggerDevCloudJobModel = self.get_job_model(session=session)
            job_type: DevCloudRemoteJobTypeEnum = job_model.remote_job_type
            if job_type == DevCloudRemoteJobTypeEnum.profiling:
                payload = self._get_payload_for_shared_folder_pipeline(job_model)
                response_json = DevCloudHttpService.trigger_shared_folder_remote_pipeline(payload)
            else:
                payload = self._get_payload_for_network_pipeline(job_model)
                response_json = DevCloudHttpService.trigger_network_remote_pipeline(payload)

        log.debug('[DevCloud Service] Remote job response is: %s', response_json)
        self.on_success()

    @staticmethod
    def _get_payload_for_shared_folder_pipeline(job_model: TriggerDevCloudJobModel) \
            -> TriggerSharedFolderRemoteJobPayload:
        project: ProjectsModel = job_model.project
        dev_cloud_platform_tag = project.target.host
        remote_job_type = job_model.remote_job_type
        setup_bundle_path = Path(job_model.setup_bundle.path).relative_to(CLOUD_SHARED_FOLDER)
        job_bundle_path = Path(job_model.job_bundle.path).relative_to(CLOUD_SHARED_FOLDER)
        return TriggerSharedFolderRemoteJobPayload(
            wbSetupBundlePath=str(setup_bundle_path),
            wbJobBundlePath=str(job_bundle_path),
            platformTag=dev_cloud_platform_tag,
            wbPipelineId=job_model.pipeline_id,
            remoteJobType=remote_job_type.value,
        )

    @staticmethod
    def _get_payload_for_network_pipeline(job_model: TriggerDevCloudJobModel) -> TriggerNetworkRemotePipelinePayload:
        project: ProjectsModel = job_model.project
        dev_cloud_platform_tag = project.target.host
        remote_job_type = job_model.remote_job_type
        return TriggerNetworkRemotePipelinePayload(
            wbSetupBundleId=job_model.setup_bundle_id,
            wbJobBundleId=job_model.job_bundle_id,
            platformTag=dev_cloud_platform_tag,
            wbPipelineId=job_model.pipeline_id,
            remoteJobType=remote_job_type.value,
        )

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready, log='Trigger DevCloud job successfully finished')
        self._job_state_subject.detach_all_observers()
