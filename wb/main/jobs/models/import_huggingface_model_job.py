"""
 OpenVINO DL Workbench
 Import huggingface model job

 Copyright (c) 2022 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
from contextlib import closing
from pathlib import Path

from sqlalchemy.orm import Session

from wb.error.job_error import ModelOptimizerError
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.huggingface_model_downloader.tool import (HuggingfaceModelDownloaderTool,
                                                                            HuggingfaceModelDownloaderParser)
from wb.main.enumerates import StatusEnum, JobTypesEnum
from wb.main.jobs.interfaces.job_observers import ImportHuggingfaceModelDBObserver
from wb.main.jobs.interfaces.job_state import JobStateSubject
from wb.main.jobs.models.base_model_related_job import BaseModelRelatedJob
from wb.main.jobs.tools_runner.local_runner import LocalRunner
from wb.main.models import EnvironmentModel, TopologiesModel, ImportHuggingfaceJobModel


class ImportHuggingfaceModelJob(BaseModelRelatedJob):
    job_type = JobTypesEnum.import_huggingface_model_type
    _job_model_class = ImportHuggingfaceJobModel
    _job_state_subject: JobStateSubject

    def _create_and_attach_observers(self):
        self._job_state_subject = JobStateSubject(self._job_id)
        self._job_state_subject.attach(ImportHuggingfaceModelDBObserver(self._job_id, self._job_model_class))
        self._attach_default_db_and_socket_observers()

    def run(self):
        with closing(get_db_session_for_celery()) as session:
            session: Session
            import_job: ImportHuggingfaceJobModel = self.get_job_model(session)
            if import_job.status in (StatusEnum.cancelled, StatusEnum.error):
                return

            self._job_state_subject.update_state(status=StatusEnum.running)

            topology: TopologiesModel = import_job.model

            environment: EnvironmentModel = topology.environment
            python_executable = environment.python_executable

        tool = HuggingfaceModelDownloaderTool(
            python_exec=python_executable,
            model_id=import_job.huggingface_model_id,
            onnx_model_path=Path(topology.path),
        )

        parser = HuggingfaceModelDownloaderParser(self._job_state_subject)
        runner = LocalRunner(tool, parser)

        return_code, message = runner.run_console_tool(self)

        if return_code:
            self._job_state_subject.update_state(status=StatusEnum.error, error_message='error')
            raise ModelOptimizerError(parser.warning, self.job_id)

        self._job_state_subject.update_state(progress=100, status=StatusEnum.ready)
        self._job_state_subject.detach_all_observers()
