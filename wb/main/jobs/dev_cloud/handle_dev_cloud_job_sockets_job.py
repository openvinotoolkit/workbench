"""
 OpenVINO DL Workbench
 Class for handling sockets from DevCloud service

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

import time
from sqlalchemy.orm import Session

from config.constants import CELERY_RETRY_COUNTDOWN
from wb.error.dev_cloud_errors import DevCloudSocketError
from wb.error.job_error import CancelTaskInChainException
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import StatusEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.interfaces.job_observers import JobStateDBObserver
from wb.main.jobs.interfaces.job_state import JobStateSubject
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser
from wb.main.models.parse_dev_cloud_result_job_model import ParseDevCloudResultJobModel
from wb.main.utils.dev_cloud_http_service import DevCloudHttpService
from wb.main.utils.dev_cloud_socket_service import DevCloudSocketService, DevCloudSocketMessage


class HandleDevCloudJobSocketsJob(IJob):
    _job_state_subject_class = JobStateSubject
    _db_observer_class = JobStateDBObserver
    _console_tool_output_parser = ConsoleToolOutputParser

    # Annotations
    _job_state_subject: JobStateSubject

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._job_state_subject = self._create_job_state_subject()
        job_db_observer = self._db_observer_class(job_id=self.job_id)
        self._job_state_subject.attach(job_db_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running,
                                             log='Starting handle DevCloud sockets job')
        with closing(get_db_session_for_celery()) as session:
            job_model = self.get_job_model(session)
            pipeline_id = job_model.pipeline_id

        socket_namespace = f'/{pipeline_id}'
        parser = self._console_tool_output_parser(self._job_state_subject)
        socket_service = DevCloudSocketService(socket_data_parser=parser, namespace=socket_namespace)

        def remote_job_failed_callback(socket_message: DevCloudSocketMessage):
            if not socket_message or not socket_message.get('error'):
                error_message = 'Remote job failed, received invalid socket message payload'
            else:
                error_message = socket_message['error']
            self._job_state_subject.update_state(status=StatusEnum.error,
                                                 error_message=error_message,
                                                 log='Received error socket message from DevCloud')

        socket_service.add_remote_job_failed_callback(callback=remote_job_failed_callback)
        socket_service.connect()

        while self.is_remote_job_running():
            # Check DevCloud socket error set from another thread with callback
            if self._job_state_subject.subject_state.status == StatusEnum.error:
                raise DevCloudSocketError(self._job_state_subject.subject_state.error_message)
            remote_job_status_response = DevCloudHttpService.get_remote_job_status(wb_pipeline_id=pipeline_id)
            if remote_job_status_response['status'] == StatusEnum.error.value:
                raise Exception('DevCloud remote job has failed')
            if remote_job_status_response['status'] == StatusEnum.cancelled.value:
                socket_service.disconnect_manually()
                raise CancelTaskInChainException(f'DevCloud remote job in pipeline {pipeline_id} was cancelled')
            log.debug('Remote job is still running. Waiting for result artifact to be uploaded')
            log.debug('Sleep for %s seconds and recheck', CELERY_RETRY_COUNTDOWN)
            time.sleep(CELERY_RETRY_COUNTDOWN)
        log.debug('Remote job has been completed, result artifact is uploaded')
        socket_service.disconnect_manually()
        self.on_success()

    def is_remote_job_running(self) -> bool:
        """Checks if result artifact file is created after finished dev cloud job"""
        with closing(get_db_session_for_celery()) as session:
            session: Session
            parse_dev_cloud_result_job_model: ParseDevCloudResultJobModel = (
                session.query(ParseDevCloudResultJobModel).filter_by(parent_job=self.job_id).first()
            )
            return not parse_dev_cloud_result_job_model.result_artifact.files

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready,
                                             progress=100,
                                             log='Handle DevCloud Job sockets job successfully finished')
        self._job_state_subject.detach_all_observers()

    def _create_job_state_subject(self) -> JobStateSubject:
        raise NotImplementedError
