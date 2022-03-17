"""
 OpenVINO DL Workbench
 Class for creation job for keras conversion

 Copyright (c) 2021 Intel Corporation

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
from contextlib import closing

from sqlalchemy.orm import Session

from wb.error.job_error import ConvertKerasError
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.convert_keras.console_output_parser import ConvertKerasOutputParser
from wb.main.console_tool_wrapper.convert_keras.tool import ConvertKerasTool
from wb.main.jobs.interfaces.job_observers import ConvertKerasModelDBObserver
from wb.main.jobs.models.base_model_related_job import BaseModelRelatedJob
from wb.main.jobs.models.convert_keras_job_state import ConvertKerasJobStateSubject
from wb.main.jobs.tools_runner.local_runner import LocalRunner
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.models import TopologiesModel, EnvironmentModel
from wb.main.models.convert_keras_job_model import ConvertKerasJobModel


class ConvertKerasJob(BaseModelRelatedJob):
    job_type = JobTypesEnum.convert_keras_type
    _job_model_class = ConvertKerasJobModel
    _job_state_subject: ConvertKerasJobStateSubject

    def _create_and_attach_observers(self):
        self._job_state_subject = ConvertKerasJobStateSubject(self._job_id)
        model_db_observer = ConvertKerasModelDBObserver(job_id=self.job_id, mapper_class=self._job_model_class)
        self._job_state_subject.attach(model_db_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(log='Starting keras model convertion', status=StatusEnum.running)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            convert_keras_job: ConvertKerasJobModel = self.get_job_model(session)
            model_path = convert_keras_job.keras_file_path
            environment: EnvironmentModel = convert_keras_job.model.environment
            python_executable = environment.python_executable
            output_path = convert_keras_job.output_path
        tool = ConvertKerasTool(python_executable=python_executable,
                                model_path=model_path, output_path=output_path)
        parser = ConvertKerasOutputParser(job_state_subject=self._job_state_subject)
        runner = LocalRunner(tool, parser)
        return_code, message = runner.run_console_tool(self)
        if return_code:
            raise ConvertKerasError(message, self._job_id)
        self.on_success()

    def on_success(self):
        with closing(get_db_session_for_celery()) as session:
            session: Session
            convert_keras_job: ConvertKerasJobModel = self.get_job_model(session)
            model: TopologiesModel = convert_keras_job.model
            self._job_state_subject.set_model_path(os.path.join(model.path, model.name))
            self._job_state_subject.update_state(log='Keras model converted', status=StatusEnum.ready)
            self._job_state_subject.detach_all_observers()
