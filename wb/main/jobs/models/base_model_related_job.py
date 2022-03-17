"""
 OpenVINO DL Workbench
 Base class for model-related jobs

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
from typing import Optional, Union

from sqlalchemy.orm import Session

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import StatusEnum, JobTypesEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.interfaces.job_observers import CreateModelDBObserver
from wb.main.models import TopologiesModel, TopologyAnalysisJobsModel, WaitModelUploadJobModel

BaseModelJobModelClassType = Union[
    TopologyAnalysisJobsModel,
    WaitModelUploadJobModel
]


class BaseModelRelatedJob(IJob):
    job_type: JobTypesEnum = None
    _job_model_class: BaseModelJobModelClassType = None

    def __init__(self, job_id: int, **unused_args):
        super().__init__(job_id=job_id)
        self._create_and_attach_observers()

    def _create_and_attach_observers(self):
        model_db_observer = CreateModelDBObserver(job_id=self.job_id, mapper_class=self._job_model_class)
        self._job_state_subject.attach(model_db_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        raise NotImplementedError

    def _get_model_from_job(self, session: Session) -> Optional[TopologiesModel]:
        job_model = self.get_job_model(session=session)
        return job_model.model

    def on_failure(self, exception: Exception):
        super().on_failure(exception)
        with closing(get_db_session_for_celery()) as session:
            model: TopologiesModel = self._get_model_from_job(session=session)
            if not model:
                return
            model.status = StatusEnum.error
            model.write_record(session=session)
            TopologiesModel.remove_model_files(model_id=model.id)

    def terminate(self):
        super().terminate()
        with closing(get_db_session_for_celery()) as session:
            model: TopologiesModel = self._get_model_from_job(session=session)
            if not model:
                return
            model.status = StatusEnum.cancelled
            model.write_record(session=session)
            TopologiesModel.remove_model_files(model_id=model.id)

    def set_task_id(self, task_id: str):
        with closing(get_db_session_for_celery()) as session:
            super().set_task_id(task_id=task_id)
            model: TopologiesModel = self._get_model_from_job(session=session)
            if not model:
                return
            model.task_id = task_id
            model.write_record(session=session)
