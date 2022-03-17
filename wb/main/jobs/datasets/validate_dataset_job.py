"""
 OpenVINO DL Workbench
 Class for created dataset validation

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
from contextlib import closing
from typing import List

from sqlalchemy.orm import Session
from openvino.tools.accuracy_checker.annotation_converters.format_converter import BaseFormatConverter

from config.constants import DATA_FOLDER
from wb.error.inconsistent_upload_error import InconsistentDatasetError
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.accuracy_utils.yml_templates import ConfigRegistry
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.datasets.base_dataset_job import BaseDatasetJob
from wb.main.models import ValidateDatasetJobsModel, DatasetTasksModel, DatasetsModel, ValidateTextDatasetJobsModel
from wb.main.shared.constants import ALLOWED_EXTENSIONS_IMG
from wb.main.shared.enumerates import TaskEnum, DatasetTypesEnum
from wb.main.shared.utils import find_all_paths_by_exts


class TaskTypeValidationProgressTracker:
    def __init__(self, task_type: TaskEnum):
        self.task_type = task_type
        self.progress = 0

    def update_validation_progress(self, progress: int):
        self.progress = progress


class ValidateDatasetJob(BaseDatasetJob):
    job_type = JobTypesEnum.validate_dataset_type
    _job_model_class = ValidateDatasetJobsModel
    _task_types_validation_progress_tracker: List[TaskTypeValidationProgressTracker] = []
    _cur_task_validation_progress_tracker = None

    @property
    def total_validation_progress(self) -> float:
        validators_progress_values = [task_type_validator.progress for task_type_validator in
                                      self._task_types_validation_progress_tracker]
        return sum(validators_progress_values) / len(self._task_types_validation_progress_tracker)

    def get_validator_by_task(self, task_type: TaskEnum) -> TaskTypeValidationProgressTracker:
        return next(task_type_validator for task_type_validator in self._task_types_validation_progress_tracker if
                    task_type_validator.task_type == task_type)

    def progress_update_callback(self, progress: int):
        self._cur_task_validation_progress_tracker.update_validation_progress(progress)
        self._job_state_subject.update_state(progress=self.total_validation_progress)

    def run(self):
        """
        Find what tasks the dataset can be used for.

        For every task, datasets of this type supports, there is a two-step validation:
            1. Checking that the dataset structure matches the expected dataset type.
               Performed during `BaseImageDatasetAdapter` subclass instantiation.
               If instantiation fails - the dataset is not correct.
            2. Checking that the images match the annotations.
               Performed by Accuracy Checker's `BaseFormatConverter.convert()`.
               Resulting annotation is ignored, only errors are checked.

        If the dataset can be used for at least one task, job succeeds,
        an exception is raised otherwise.
        """

        self._job_state_subject.update_state(log='Starting Validating job', progress=0, status=StatusEnum.running)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            dataset_validator_job: ValidateDatasetJobsModel = self.get_job_model(session)
            dataset: DatasetsModel = dataset_validator_job.dataset.converted_to or dataset_validator_job.dataset
            if dataset.status in (StatusEnum.cancelled, StatusEnum.error):
                return

            dataset_recognizer = ConfigRegistry.dataset_recognizer_registry[dataset.dataset_type]
            for task_type in dataset_recognizer.task_type_to_adapter.keys():
                self._task_types_validation_progress_tracker.append(TaskTypeValidationProgressTracker(task_type))
            if dataset.dataset_type == DatasetTypesEnum.not_annotated:
                dataset_adapter = dataset_recognizer.provide_adapter(None, dataset.path)
                images = find_all_paths_by_exts(dataset_adapter.images_dir, ALLOWED_EXTENSIONS_IMG)
                dataset.number_images = len(list(images))
                dataset.write_record(session)
                self.on_success()
                return

            errors = []

            for task_type, dataset_adapter_class in dataset_recognizer.task_type_to_adapter.items():
                self._cur_task_validation_progress_tracker = self.get_validator_by_task(task_type)
                try:
                    dataset_adapter = dataset_adapter_class(dataset.path)
                    annotation_converter = BaseFormatConverter.provide(
                        dataset_adapter.params['converter'],
                        dataset_adapter.params
                    )

                    try:
                        conversion_result = annotation_converter.convert(
                            check_content=True,
                            progress_callback=self.progress_update_callback,
                            progress_interval=20  # The callback is called after every 20 checked images.
                        )
                    except FileNotFoundError as exception:
                        missed_path = str(exception).split(f'{DATA_FOLDER}/datasets/{dataset.id}/')[-1]
                        message = f'{missed_path} not found.'
                        raise InconsistentDatasetError(message)

                    if conversion_result.content_check_errors:
                        raise InconsistentDatasetError(conversion_result.content_check_errors)
                    self._cur_task_validation_progress_tracker.update_validation_progress(100)

                    # The following attributes are expected to be the same for all tasks the dataset supports.
                    if not dataset.number_images:
                        labels_number, max_label_id = dataset_adapter.get_label_data()
                        dataset.labels_number = labels_number
                        dataset.max_label_id = max_label_id
                        if task_type == TaskEnum.super_resolution:
                            dataset_adapter.images_dir = dataset_adapter.get_task_specific_constants()['lr_dir']
                        images = find_all_paths_by_exts(dir_path=dataset_adapter.images_dir,
                                                        extensions=ALLOWED_EXTENSIONS_IMG,
                                                        recursive=True)
                        dataset.number_images = len(list(images))
                        dataset.write_record(session)

                    dataset_task_model = DatasetTasksModel(dataset, task_type)
                    dataset_task_model.write_record(session)
                except Exception as exception:
                    errors.append(exception)
            if not list(dataset.task_types):
                exception = errors[0]
                raise exception
            self.on_success()

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready, progress=100)
        self._job_state_subject.detach_all_observers()


class ValidateTextDatasetJob(BaseDatasetJob):
    job_type = JobTypesEnum.validate_text_dataset_type
    _job_model_class = ValidateTextDatasetJobsModel
    _task_types_validation_progress_tracker: List[TaskTypeValidationProgressTracker] = []
    _cur_task_validation_progress_tracker = None

    def run(self):
        self._job_state_subject.update_state(log='Starting Validating job', progress=0, status=StatusEnum.running)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            dataset_validator_job: ValidateTextDatasetJobsModel = self.get_job_model(session)
            dataset: DatasetsModel = dataset_validator_job.dataset
            if dataset.status in (StatusEnum.cancelled, StatusEnum.error):
                return

            DatasetTasksModel(
                dataset,
                task_type=dataset_validator_job.task_type,
            ).write_record(session)

            self.on_success()

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready, progress=100)
        self._job_state_subject.detach_all_observers()
