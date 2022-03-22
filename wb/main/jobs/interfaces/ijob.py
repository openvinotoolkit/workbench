"""
 OpenVINO DL Workbench
 Interface for a common backend job

 Copyright (c) 2018 Intel Corporation

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
import logging
from contextlib import closing
from typing import Type

from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import StaleDataError

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import StatusEnum, JobTypesEnum
from wb.main.jobs.interfaces.job_observers import JobStateDBObserver
from wb.main.jobs.interfaces.job_state import JobStateSubject
from wb.main.jobs.interfaces.pipeline_socket_observer_creator import PipelineSocketObserverCreator
from wb.main.jobs.utils.database_functions import set_statuses_in_db
from wb.main.models import JobsModel


class JobFactory:
    registry = {}

    @staticmethod
    def register(job_class: Type['IJob']):
        if not job_class.job_type:
            return
        JobFactory.registry[job_class.job_type] = job_class

    @staticmethod
    def create_job(job_type: JobTypesEnum, job_id: int, celery_task) -> 'IJob':
        job_class = JobFactory.registry[job_type]
        job = job_class.create(job_id)
        job.celery_task = celery_task
        return job


class JobMetaClass(type):
    def __new__(cls, *args, **kwargs):
        job_class = super(JobMetaClass, cls).__new__(cls, *args, **kwargs)
        JobFactory.register(job_class)
        return job_class


class IJob(metaclass=JobMetaClass):
    job_type: JobTypesEnum = None
    _job_id: int

    subprocess = []

    # Annotations
    _job_model_class: Type[JobsModel] = JobsModel
    _job_state_subject: JobStateSubject

    def __init__(self, job_id: int = None):
        self.celery_task = None
        self._job_id = job_id
        self._job_state_subject = JobStateSubject(self._job_id)

    @classmethod
    def create(cls, job_id: int) -> 'IJob':
        return cls(job_id=job_id)

    def run(self):
        raise NotImplementedError

    def get_job_model(self, session: Session) -> JobsModel:
        return session.query(self._job_model_class).get(self._job_id)

    def set_task_id(self, task_id: str):
        with closing(get_db_session_for_celery()) as session:
            record = self.get_job_model(session)
            if not record:
                return
            record.task_id = task_id
            record.write_record(session)

    def on_failure(self, exception: Exception):
        message = str(exception)
        with closing(get_db_session_for_celery()) as session:
            self._mark_next_jobs_as_cancelled(session=session)
        self._job_state_subject.update_state(status=StatusEnum.error, error_message=message)
        self._job_state_subject.detach_all_observers()

    def terminate(self):
        job_model_class_with_id = f'{self._job_model_class} with id {self._job_id}'
        logging.debug('Terminating job %s', job_model_class_with_id)
        with closing(get_db_session_for_celery()) as session:
            self._mark_next_jobs_as_cancelled(session=session)
        try:
            self._job_state_subject.update_state(status=StatusEnum.cancelled,
                                                 log=f'Job {job_model_class_with_id} was cancelled.')
        except StaleDataError:
            logging.debug('Terminated job model %s was already removed from database', job_model_class_with_id)
        self._job_state_subject.detach_all_observers()

    def _mark_next_jobs_as_cancelled(self, session: Session):
        job_model = self.get_job_model(session=session)
        if not job_model or not isinstance(job_model, JobsModel):
            # In model-related jobs _job_model_class field is set to TopologiesModel
            # instead of JobsModel or inherited class.
            # pylint: disable=fixme
            # TODO: Remove this check after moving all jobs to pipeline approach
            return
        jobs_to_cancel = list(set(job_model.next_jobs).union(job_model.next_jobs_in_pipeline))
        job_execution_details_to_cancel = [job.execution_details for job in jobs_to_cancel if job.execution_details]
        records_to_cancel = jobs_to_cancel + job_execution_details_to_cancel
        set_statuses_in_db(records=records_to_cancel, status=StatusEnum.cancelled, session=session)

    def _attach_socket_default_observer(self):
        with closing(get_db_session_for_celery()) as session:
            pipeline_type = self.get_job_model(session).pipeline.type
        pipeline_socket_observer = PipelineSocketObserverCreator.create(current_job_id=self._job_id,
                                                                        pipeline_type=pipeline_type)
        self._job_state_subject.attach(pipeline_socket_observer)

    def _attach_db_execution_details_observer(self):
        job_state_db_observer = JobStateDBObserver(job_id=self._job_id)
        self._job_state_subject.attach(job_state_db_observer)

    def _attach_default_db_and_socket_observers(self):
        self._attach_db_execution_details_observer()
        self._attach_socket_default_observer()

    @property
    def job_state_subject(self) -> JobStateSubject:
        return self._job_state_subject

    @property
    def job_model_class(self) -> Type[JobsModel]:
        return self._job_model_class

    @property
    def job_id(self) -> int:
        return self._job_id
