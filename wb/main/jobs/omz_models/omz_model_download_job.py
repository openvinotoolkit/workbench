"""
 OpenVINO DL Workbench
 Class for OMZ model download job

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
import os
from contextlib import closing

from sqlalchemy.orm import Session

from config.constants import MODEL_DOWNLOADS_FOLDER
from wb.error.job_error import ModelDownloaderError
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.model_downloader.console_output_parser import ModelDownloaderParser
from wb.main.console_tool_wrapper.model_downloader.error_message_processor import ModelDownloaderErrorMessageProcessor
from wb.main.console_tool_wrapper.model_downloader.tool import ModelDownloaderTool, ModelDownloaderData
from wb.main.enumerates import JobTypesEnum
from wb.main.enumerates import StatusEnum
from wb.main.jobs.interfaces.job_observers import OMZModelDownloadDBObserver
from wb.main.jobs.models.base_model_related_job import BaseModelRelatedJob
from wb.main.jobs.tools_runner.local_runner import LocalRunner
from wb.main.models.omz_model_download_job_model import OMZModelDownloadJobModel
from wb.main.utils.utils import remove_dir


class OMZModelDownloadJob(BaseModelRelatedJob):
    job_type = JobTypesEnum.omz_model_download_type
    _job_model_class = OMZModelDownloadJobModel

    def _create_and_attach_observers(self):
        model_download_db_observer = OMZModelDownloadDBObserver(job_id=self.job_id,
                                                                mapper_class=OMZModelDownloadJobModel)
        self._job_state_subject.attach(model_download_db_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(log='Started downloading model from OMZ', status=StatusEnum.running)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            download_job: OMZModelDownloadJobModel = self.get_job_model(session)
            parser = ModelDownloaderParser(job_state_subject=self.job_state_subject)
            tool = self._setup_parameters(ModelDownloaderData(
                name=download_job.name,
                outputDir=os.path.join(MODEL_DOWNLOADS_FOLDER, str(download_job.result_model_id))
            ))
        runner = LocalRunner(tool, parser)

        return_code, message = runner.run_console_tool(self)
        if return_code:
            error = ModelDownloaderErrorMessageProcessor.recognize_error(message)
            raise ModelDownloaderError(error, self.job_id)
        self._job_state_subject.update_state(status=StatusEnum.ready, progress=100)
        self._job_state_subject.detach_all_observers()

    def on_failure(self, exception: Exception):
        super().on_failure(exception)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            download_job: OMZModelDownloadJobModel = self.get_job_model(session)
            remove_dir(os.path.join(MODEL_DOWNLOADS_FOLDER, str(download_job.result_model_id)))

    def _setup_parameters(self, config: ModelDownloaderData) -> ModelDownloaderTool:
        try:
            parameters = ModelDownloaderTool(config=config)
        except ValueError as error:
            raise ModelDownloaderError(str(error), self.job_id)
        return parameters
