"""
 OpenVINO DL Workbench
 Implementation specific data base observer for create environment job

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
