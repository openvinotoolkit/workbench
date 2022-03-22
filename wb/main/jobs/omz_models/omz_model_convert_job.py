"""
 OpenVINO DL Workbench
 Class for job to convert downloaded OMZ model

 Copyright (c) 2021 Intel Corporation

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
import json
import os
from contextlib import closing

from sqlalchemy.orm import Session

from config.constants import MODEL_DOWNLOADS_FOLDER, MODEL_OPTIMIZER_RETRY_COUNTDOWN, MODEL_OPTIMIZER_MAX_RETRY
from wb.error.job_error import ModelOptimizerError, ManualTaskRetryException
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.model_downloader.converter_error_message_processor import (
    OMZTopologyConvertErrorMessageProcessor)
from wb.main.console_tool_wrapper.model_downloader.converter_parser import OMZTopologyConvertParser
from wb.main.console_tool_wrapper.model_downloader.converter_tool import OMZTopologyConvertTool, OMZTopologyConvertData
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.interfaces.job_observers import OMZModelDownloadDBObserver
from wb.main.jobs.models.base_model_related_job import BaseModelRelatedJob
from wb.main.jobs.tools_runner.local_runner import LocalRunner
from wb.main.models import OMZModelConvertJobModel, OMZModelDownloadJobModel


class OMZModelConvertJob(BaseModelRelatedJob):
    job_type = JobTypesEnum.omz_model_convert_type
    _job_model_class = OMZModelConvertJobModel

    def _create_and_attach_observers(self):
        model_download_db_observer = OMZModelDownloadDBObserver(job_id=self.job_id, mapper_class=self._job_model_class)
        self._job_state_subject.attach(model_download_db_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        with closing(get_db_session_for_celery()) as session:
            session: Session
            convert_model_job: OMZModelConvertJobModel = self.get_job_model(session)
            download_model: OMZModelDownloadJobModel = convert_model_job.previous_job
            if (not convert_model_job.conversion_args or
                    (download_model and download_model.status != StatusEnum.ready)):
                raise ManualTaskRetryException('Model optimizer parameters are not provided yet, retry task',
                                               countdown=MODEL_OPTIMIZER_RETRY_COUNTDOWN,
                                               max_retries=MODEL_OPTIMIZER_MAX_RETRY)
            self._job_state_subject.update_state(log='Started OMZ model conversion job', status=StatusEnum.running)
            environment = convert_model_job.model.environment
            tool = OMZTopologyConvertTool(OMZTopologyConvertData(
                python_executable=environment.python_executable,
                downloadDir=os.path.join(MODEL_DOWNLOADS_FOLDER, str(convert_model_job.result_model_id)),
                name=convert_model_job.model.name,
                precision=json.loads(convert_model_job.conversion_args)['precision']
            ))
        parser = OMZTopologyConvertParser(self._job_state_subject)
        runner = LocalRunner(tool, parser)

        return_code, message = runner.run_console_tool(self)
        if return_code:
            error = OMZTopologyConvertErrorMessageProcessor.recognize_error(message)
            raise ModelOptimizerError(error, self.job_id)
        self._job_state_subject.update_state(status=StatusEnum.ready, progress=100)
        self._job_state_subject.detach_all_observers()
