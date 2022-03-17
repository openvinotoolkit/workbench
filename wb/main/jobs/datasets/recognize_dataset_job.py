"""
 OpenVINO DL Workbench
 Dataset recognizer.

 Copyright (c) 2020 Intel Corporation

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

from wb.error.inconsistent_upload_error import UnknownDatasetError
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.accuracy_utils.yml_templates.registry import ConfigRegistry
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.datasets.base_dataset_job import BaseDatasetJob
from wb.main.models import DatasetsModel, RecognizeDatasetJobsModel
from wb.main.shared.enumerates import DatasetTypesEnum
from wb.main.utils.utils import remove_dir


class RecognizeDatasetJob(BaseDatasetJob):
    job_type = JobTypesEnum.recognize_dataset_type
    _job_model_class = RecognizeDatasetJobsModel

    def run(self):
        self._job_state_subject.update_state(log='Starting Recognizing job', progress=0, status=StatusEnum.running)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            dataset_recognizer_job: RecognizeDatasetJobsModel = self.get_job_model(session)
            dataset: DatasetsModel = dataset_recognizer_job.dataset
            if dataset.status in (StatusEnum.cancelled, StatusEnum.error):
                return
            # Early exit if dataset type is already defined by user
            if not dataset.dataset_type:
                dataset_path = dataset.path
                dataset.dataset_type = self._recognize(dataset_path)
            dataset.write_record(session)
            self._job_state_subject.update_state(status=StatusEnum.ready, progress=100)
            self._job_state_subject.detach_all_observers()

    @staticmethod
    def _recognize(path: str):
        for dataset_type, dataset_recognizer in ConfigRegistry.dataset_recognizer_registry.items():
            if dataset_recognizer.recognize(path):
                return dataset_type
        remove_dir(path)
        raise UnknownDatasetError('Unknown dataset type')
