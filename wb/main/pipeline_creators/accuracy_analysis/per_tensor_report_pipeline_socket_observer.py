"""
 OpenVINO DL Workbench
 Class for per tensor report pipeline socket observer

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

from sqlalchemy.orm import Session

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.jobs.interfaces.job_observers import PipelineSocketObserver
from wb.main.models import JobsModel


class PerTensorReportPipelineSocketObserver(PipelineSocketObserver):
    def _get_socket_payload(self) -> dict:
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job: JobsModel = session.query(JobsModel).get(self._current_job_id)
            return job.pipeline.json()
