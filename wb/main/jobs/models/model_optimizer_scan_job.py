"""
 OpenVINO DL Workbench
 Class for job of model creation

 Copyright (c) 2018 Intel Corporation

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

from sqlalchemy.orm import Session

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.model_optimizer.model_optimizer_scan_console_output_parser import \
    ModelOptimizerScanParser
from wb.main.console_tool_wrapper.model_optimizer.tool import ModelOptimizerTool
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.interfaces.job_observers import MOScanDBObserver
from wb.main.jobs.models.base_model_related_job import BaseModelRelatedJob
from wb.main.jobs.models.model_optimizer_scan_job_state import ModelOptimizerScanJobStateSubject
from wb.main.jobs.tools_runner.local_runner import LocalRunner
from wb.main.model_optimizer.mo_arg_processor import MOArgProcessor
from wb.main.models import EnvironmentModel, ModelOptimizerScanJobModel, TopologiesModel


class ModelOptimizerScanJob(BaseModelRelatedJob):
    job_type = JobTypesEnum.model_optimizer_scan_type
    _job_model_class = ModelOptimizerScanJobModel
    _job_state_subject = ModelOptimizerScanJobStateSubject

    def _create_and_attach_observers(self):
        self._job_state_subject = ModelOptimizerScanJobStateSubject(self._job_id)
        mo_scan_db_observer = MOScanDBObserver(job_id=self._job_id, mapper_class=self._job_model_class)
        self._job_state_subject.attach(mo_scan_db_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        mo_args = {}
        self._job_state_subject.update_state(log='Starting model optimizer scan job', status=StatusEnum.running)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            mo_scan_job: ModelOptimizerScanJobModel = self.get_job_model(session)
            model: TopologiesModel = mo_scan_job.model

            environment: EnvironmentModel = model.environment
            python_executable = environment.python_executable

            MOArgProcessor.process_file_args(mo_scan_job.job_id, mo_args, model)

        tool = ModelOptimizerTool(python_executable=python_executable, mo_args=mo_args,
                                  environment={'MO_ENABLED_TRANSFORMS': 'ANALYSIS_JSON_PRINT'})

        parser = ModelOptimizerScanParser(job_state_subject=self._job_state_subject)
        runner = LocalRunner(tool, parser)

        return_code, output = runner.run_console_tool(self)

        if return_code:
            output = re.sub(r'^.*ERROR ]\s*', '', re.sub(r'(\n\s*)+', '\n', output))
            log.error('[ MODEL OPTIMIZER ] [ ERROR ]: %s', output)
            self._job_state_subject.update_model_optimizer_scan_result(json.dumps({}))
            self._job_state_subject.update_state(status=StatusEnum.error, error_message=output)
        else:
            self.parse_mo_scan_results(output)
            self._job_state_subject.update_state(progress=100, status=StatusEnum.ready)
        self._job_state_subject.detach_all_observers()

    def parse_mo_scan_results(self, mo_scan_output: str):

        # Make single line from multiline to create correct JSON file
        mo_scan_output = mo_scan_output.replace('\n', '')

        first_bracket = mo_scan_output.index('{')
        last_bracket = mo_scan_output.rindex('}')

        mo_scan_result = mo_scan_output[first_bracket:last_bracket+1]

        try:
            parsed_mo_analyzed_params = json.loads(mo_scan_result)

            for _, input_data in parsed_mo_analyzed_params['inputs'].items():
                for i, shape in enumerate(input_data['shape']):
                    try:
                        input_data['shape'][i] = int(shape)
                    except ValueError:
                        # TODO: Workaround for 76715
                        input_data['shape'] = [-1, -1, -1, -1]
        except json.decoder.JSONDecodeError:
            return
        self._job_state_subject.update_model_optimizer_scan_result(json.dumps(parsed_mo_analyzed_params))

    def on_failure(self, exception: Exception):
        self._job_state_subject.update_model_optimizer_scan_result(json.dumps({}))
        super().on_failure(exception)

    def set_task_id(self, task_id: str):
        super().set_task_id(task_id)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            mo_scan_job: ModelOptimizerScanJobModel = self.get_job_model(session)
            original_model: TopologiesModel = mo_scan_job.model
            resulting_model: TopologiesModel = session.query(TopologiesModel).filter_by(
                converted_from=original_model.id).first()
            resulting_model.task_id = task_id
            resulting_model.write_record(session)
