"""
 OpenVINO DL Workbench
 Base class for dataset-related job

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
from wb.main.jobs.interfaces.job_observers import CreateDatasetDBObserver
from wb.main.models import ConvertDatasetJobsModel, DatasetsModel, ExtractDatasetJobsModel, \
    RecognizeDatasetJobsModel, ValidateDatasetJobsModel, WaitDatasetUploadJobsModel, \
    ExtractTextDatasetJobsModel, ValidateTextDatasetJobsModel

BaseDatasetJobModelClassType = Union[
    ConvertDatasetJobsModel,
    ExtractDatasetJobsModel,
    ExtractTextDatasetJobsModel,
    RecognizeDatasetJobsModel,
    ValidateDatasetJobsModel,
    ValidateTextDatasetJobsModel,
    WaitDatasetUploadJobsModel
]


class BaseDatasetJob(IJob):
    # Need to be defined in inherited classes
    job_type: JobTypesEnum = None
    _job_model_class: BaseDatasetJobModelClassType = None

    def __init__(self, job_id: int, **unused_args):
        super().__init__(job_id=job_id)
        self._create_and_attach_observers()

    def _create_and_attach_observers(self):
        dataset_db_observer = CreateDatasetDBObserver(job_id=self.job_id, mapper_class=self._job_model_class)
        self._job_state_subject.attach(dataset_db_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        raise NotImplementedError

    def _get_dataset(self, session: Session) -> Optional[DatasetsModel]:
        dataset_job = self.get_job_model(session=session)
        return dataset_job.dataset

    def on_failure(self, exception: Exception):
        super().on_failure(exception)
        with closing(get_db_session_for_celery()) as session:
            dataset: DatasetsModel = self._get_dataset(session=session)
            if not dataset:
                return
            dataset.status = StatusEnum.error
            dataset.write_record(session=session)
            DatasetsModel.remove_dataset_files(dataset_id=dataset.id)

    def terminate(self):
        super().terminate()
        with closing(get_db_session_for_celery()) as session:
            dataset: DatasetsModel = self._get_dataset(session=session)
            if not dataset:
                return
            dataset.status = StatusEnum.cancelled
            dataset.write_record(session=session)
            DatasetsModel.remove_dataset_files(dataset_id=dataset.id)

    def set_task_id(self, task_id: str):
        with closing(get_db_session_for_celery()) as session:
            super().set_task_id(task_id=task_id)
            dataset: DatasetsModel = self._get_dataset(session=session)
            if not dataset:
                return
            dataset.task_id = task_id
            dataset.write_record(session=session)
