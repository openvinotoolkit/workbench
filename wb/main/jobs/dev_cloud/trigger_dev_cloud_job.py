"""
 OpenVINO DL Workbench
 Class for triggering job in the DevCloud service

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
import logging as log
from contextlib import closing

from sqlalchemy.orm import Session

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.enumerates import JobTypesEnum
from wb.main.enumerates import StatusEnum
from wb.main.models.projects_model import ProjectsModel
from wb.main.models.trigger_dev_cloud_job_model import TriggerDevCloudJobModel
from wb.main.utils.dev_cloud_http_service import DevCloudHttpService, TriggerRemoteJobPayload


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
            project: ProjectsModel = job_model.project
            dev_cloud_platform_tag = project.target.host
            remote_job_type = job_model.remote_job_type

        payload = TriggerRemoteJobPayload(
            wbSetupBundleId=job_model.setup_bundle_id,
            wbJobBundleId=job_model.job_bundle_id,
            platformTag=dev_cloud_platform_tag,
            wbPipelineId=job_model.pipeline_id,
            remoteJobType=remote_job_type.value,
        )
        response_json = DevCloudHttpService.trigger_remote_job(payload)
        log.debug('[ DevCloud Service ] Remote job response is: %s', response_json)
        self.on_success()

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready, log='Trigger DevCloud job successfully finished')
        self._job_state_subject.detach_all_observers()
