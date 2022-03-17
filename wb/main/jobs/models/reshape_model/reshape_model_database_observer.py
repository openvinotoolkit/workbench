"""
 OpenVINO DL Workbench
 Class for saving data to database from reshape model pipeline

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
from contextlib import closing

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.jobs.interfaces.job_observers import JobStateDBObserver, check_existing_job_model_decorator
from wb.main.jobs.interfaces.job_state import JobState
from wb.main.models import ReshapeModelJobModel


class ReshapeModelDBObserver(JobStateDBObserver):
    _mapper_class = ReshapeModelJobModel

    @check_existing_job_model_decorator
    def update(self, subject_state: JobState):
        session = get_db_session_for_celery()
        with closing(session):
            job_model: ReshapeModelJobModel = self.get_job_model(session)
            job_model.progress = subject_state.progress or job_model.progress
            job_model.status = subject_state.status or job_model.status
            job_model.error_message = subject_state.error_message or job_model.error_message
            job_model.write_record(session)

            shape_configuration = job_model.shape_model_configuration
            shape_configuration.status = job_model.status
            shape_configuration.write_record(session)
