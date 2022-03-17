"""
 OpenVINO DL Workbench
 Class for model optimizer job

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
import json
import logging as log
import re
from contextlib import closing
from pathlib import Path

from sqlalchemy.orm import Session

from config.constants import (ORIGINAL_FOLDER, UPLOAD_FOLDER_MODELS, MODEL_OPTIMIZER_RETRY_COUNTDOWN,
                              MODEL_OPTIMIZER_MAX_RETRY)
from wb.error.job_error import ModelOptimizerError, ManualTaskRetryException
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.model_optimizer.console_output_parser import ModelOptimizerParser
from wb.main.console_tool_wrapper.model_optimizer.tool import ModelOptimizerTool
from wb.main.enumerates import StatusEnum, JobTypesEnum
from wb.main.jobs.interfaces.job_observers import ModelOptimizerDBObserver
from wb.main.jobs.models.base_model_related_job import BaseModelRelatedJob
from wb.main.jobs.models.model_optimizer_job_state import ModelOptimizerJobStateSubject
from wb.main.jobs.tools_runner.local_runner import LocalRunner
from wb.main.model_optimizer.mo_arg_processor import MOArgProcessor
from wb.main.models import EnvironmentModel, ModelOptimizerJobModel, TopologiesModel


class ModelOptimizerJob(BaseModelRelatedJob):
    job_type = JobTypesEnum.model_optimizer_type
    _job_model_class = ModelOptimizerJobModel
    _job_state_subject: ModelOptimizerJobStateSubject

    def _create_and_attach_observers(self):
        self._job_state_subject = ModelOptimizerJobStateSubject(self._job_id)
        mo_db_observer = ModelOptimizerDBObserver(job_id=self._job_id)
        self._job_state_subject.attach(mo_db_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        with closing(get_db_session_for_celery()) as session:
            session: Session
            mo_job: ModelOptimizerJobModel = self.get_job_model(session)
            if mo_job.status in (StatusEnum.cancelled, StatusEnum.error):
                return

            mo_args = json.loads(mo_job.mo_args) if mo_job.mo_args else None
            if not mo_args:
                raise ManualTaskRetryException('Model optimizer parameters are not provided yet, retry task',
                                               countdown=MODEL_OPTIMIZER_RETRY_COUNTDOWN,
                                               max_retries=MODEL_OPTIMIZER_MAX_RETRY)
            self._job_state_subject.update_state(log='Starting model optimizer job', status=StatusEnum.running)

            original_topology: TopologiesModel = mo_job.original_topology
            resulting_topology: TopologiesModel = mo_job.model
            resulting_topology.converted_from = mo_job.original_topology_id

            environment: EnvironmentModel = original_topology.environment
            python_executable = environment.python_executable

            model_path = str(Path(UPLOAD_FOLDER_MODELS) / str(mo_job.result_model_id) / ORIGINAL_FOLDER)
            arg_processor = MOArgProcessor(mo_job)

            self._job_state_subject.set_model_path(model_path)
            arg_processor.process_file_args(mo_job.job_id, mo_args, original_topology)

            self._job_state_subject.set_mo_args(json.dumps(mo_args))

            arg_processor.add_misc_arguments(model_path, mo_args)

        tool = ModelOptimizerTool(python_executable=python_executable,
                                  mo_args=mo_args)

        parser = ModelOptimizerParser(self._job_state_subject)
        runner = LocalRunner(tool, parser)

        return_code, message = runner.run_console_tool(self)

        if return_code:
            match = re.search(r': (.+)\.\s+For more information please refer to Model Optimizer FAQ', message)
            short_error_message = match.group(1) if match else 'Model Optimizer failed'

            log.error('[ MODEL OPTIMIZER ] [ ERROR ]: %s', short_error_message)
            self._job_state_subject.update_state(status=StatusEnum.error, error_message=short_error_message)
            detailed_error = re.sub(r'\[ ERROR \]\s*', '', re.sub(r'(\n\s*)+', '\n', message))
            self._job_state_subject.set_detailed_error_message(detailed_error)
            raise ModelOptimizerError(short_error_message, self.job_id)

        self._job_state_subject.update_state(progress=100, status=StatusEnum.ready)
        self._job_state_subject.detach_all_observers()
