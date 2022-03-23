"""
 OpenVINO DL Workbench
 Implementation specific data base observer for create environment job

 Copyright (c) 2021 Intel Corporation

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

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.accuracy_utils.yml_templates import ConfigRegistry
from wb.main.enumerates import StatusEnum
from wb.main.jobs.interfaces.job_observers import JobStateDBObserver, check_existing_job_model_decorator
from wb.main.jobs.interfaces.job_state import JobState
from wb.main.models import AnnotateDatasetJobModel, DatasetTasksModel, DatasetsModel
from wb.main.scripts.dataset_annotator import TaskToAutoAnnotatedDatasetTypeMapper
from wb.main.shared.constants import ALLOWED_EXTENSIONS_IMG
from wb.main.shared.enumerates import TaskEnum
from wb.main.shared.utils import find_all_paths_by_exts


class AnnotateDatasetDBObserver(JobStateDBObserver):
    _mapper_class = AnnotateDatasetJobModel

    @check_existing_job_model_decorator
    def update(self, subject_state: JobState):
        with closing(get_db_session_for_celery()) as session:
            job: AnnotateDatasetJobModel = self.get_job_model(session)
            job.progress = subject_state.progress or job.progress
            job.status = subject_state.status or job.status
            job.error_message = subject_state.error_message or job.error_message
            job.write_record(session)

            dataset = job.result_dataset
            dataset.progress = subject_state.progress or job.progress
            dataset.status = subject_state.status or job.status
            dataset.error_message = subject_state.error_message or job.error_message
            dataset.write_record(session)
            if job.status == StatusEnum.ready:
                self._fill_dataset_data(dataset, job.project.topology.meta.task_type, session)

    @staticmethod
    def _fill_dataset_data(dataset: DatasetsModel, task_type: TaskEnum, session: Session):
        dataset.dataset_type = TaskToAutoAnnotatedDatasetTypeMapper.get_dataset_type_by_task(task_type)
        dataset_adapter = ConfigRegistry.dataset_recognizer_registry[dataset.dataset_type].provide_adapter(
            task_type,
            dataset.path,
        )
        images = find_all_paths_by_exts(dataset_adapter.images_dir, ALLOWED_EXTENSIONS_IMG)
        dataset.number_images = len(list(images))
        dataset.write_record(session)
        dataset_task_model = DatasetTasksModel(dataset, task_type)
        dataset_task_model.write_record(session)
