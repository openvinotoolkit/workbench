"""
 OpenVINO DL Workbench
 Dataset recognizer.

 Copyright (c) 2020 Intel Corporation

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
