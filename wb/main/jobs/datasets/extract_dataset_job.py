"""
 OpenVINO DL Workbench
 Class for dataset extraction job for dataset creation

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

import os
from contextlib import closing
from pathlib import Path
from shutil import move, rmtree
from typing import Optional

import pandas
from sqlalchemy.orm import Session

from config.constants import UPLOAD_FOLDER_DATASETS, UPLOADS_FOLDER
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.datasets.base_dataset_job import BaseDatasetJob
from wb.main.jobs.datasets.extract_dataset_job_state import ExtractDatasetJobStateSubject
from wb.main.jobs.interfaces.job_observers import ExtractDatasetDBObserver
from wb.main.jobs.utils.archive_extractor import Extractor
from wb.main.jobs.utils.text_dataset_extractor import TextDataExtractor
from wb.main.models import ExtractDatasetJobsModel, DatasetsModel, FilesModel
from wb.main.models.extract_dataset_jobs_model import ExtractTextDatasetJobsModel
from wb.main.shared.constants import VOC_ROOT_FOLDER
from wb.main.utils.utils import remove_dir, get_size_of_files


class ExtractDatasetJob(BaseDatasetJob):
    job_type = JobTypesEnum.extract_dataset_type
    _job_model_class = ExtractDatasetJobsModel
    _job_state_subject = ExtractDatasetJobStateSubject

    def _create_and_attach_observers(self):
        self._job_state_subject = ExtractDatasetJobStateSubject(self.job_id)
        extract_dataset_db_observer = ExtractDatasetDBObserver(job_id=self.job_id, mapper_class=self._job_model_class)
        self._job_state_subject.attach(extract_dataset_db_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(log='Starting Extracting job', status=StatusEnum.running, progress=0)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            dataset_extractor_job: ExtractDatasetJobsModel = self.get_job_model(session)
            dataset: DatasetsModel = dataset_extractor_job.dataset
            file: FilesModel = dataset.files[0]
            if dataset.status in (StatusEnum.cancelled, StatusEnum.error):
                return
            uploaded_archive_path = file.path
            self._unpack(dataset.id, file.name, uploaded_archive_path, UPLOAD_FOLDER_DATASETS)
            dataset_path = os.path.join(UPLOAD_FOLDER_DATASETS, str(dataset.id))
            delete_invalid_content(dataset_path)
            self._job_state_subject.set_path(dataset_path)
            size = get_size_of_files(dataset.path)
            self._job_state_subject.set_size(size)
            remove_dir(os.path.join(UPLOADS_FOLDER, str(dataset.id)))

            self.on_success()

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready,
                                             log='Dataset extract job successfully finished')
        self._job_state_subject.detach_all_observers()

    def _unpack(self, file_id: int, name: str, path: str, upload_folder: str):
        os.makedirs(upload_folder, exist_ok=True)
        # pylint: disable=fixme
        # TODO: 47630 - Refactor dataset extractor to remove erroneous dataset upload
        #  (on error and cancel - override on_failure and terminate methods with cleanup + change extractor API)
        extractor = Extractor(file_id, name, path, self, upload_folder)
        extractor.extract_archive()


class ExtractTextDatasetJob(ExtractDatasetJob):
    job_type = JobTypesEnum.extract_text_dataset_type
    _job_model_class = ExtractTextDatasetJobsModel
    _job_state_subject = ExtractDatasetJobStateSubject

    def __init__(self, job_id: int, **unused_args):
        super().__init__(job_id=job_id)
        self.dataset_extractor_job: Optional[ExtractTextDatasetJobsModel] = None

    def run(self):
        self._job_state_subject.update_state(log='Starting Extracting job', status=StatusEnum.running, progress=0)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            self.dataset_extractor_job = self.get_job_model(session)
            dataset: DatasetsModel = self.dataset_extractor_job.dataset
            file: FilesModel = dataset.files[0]
            if dataset.status in (StatusEnum.cancelled, StatusEnum.error):
                return
            uploaded_file_path = Path(file.path)
            self._unpack(
                dataset.id, file.name, uploaded_file_path, UPLOAD_FOLDER_DATASETS
            )
            dataset.write_record(session)
            dataset_path = UPLOAD_FOLDER_DATASETS / str(dataset.id)
            delete_invalid_content(dataset_path)
            self._job_state_subject.set_path(str(dataset_path))
            size = get_size_of_files(dataset.path)
            self._job_state_subject.set_size(size)
            remove_dir(os.path.join(UPLOADS_FOLDER, str(dataset.id)))

            self.on_success()

    def _unpack(self, file_id: int, name: str, path: Path, upload_folder: Path):
        os.makedirs(upload_folder, exist_ok=True)
        extractor = TextDataExtractor(file_id, name, path, upload_folder)
        dataset_dataframe = extractor.extract_text_dataset(
            header=self.dataset_extractor_job.header,
            separator=self.dataset_extractor_job.separator.value,
            encoding=self.dataset_extractor_job.encoding,
            columns=self.dataset_extractor_job.columns,
            update_state=self.job_state_subject.update_state,
        )
        self._fill_dataset_model(dataset_dataframe, dataset_model=self.dataset_extractor_job.dataset)

    @staticmethod
    def _fill_dataset_model(dataset_dataframe: pandas.DataFrame, dataset_model: DatasetsModel) -> None:
        dataset_model.number_samples = len(dataset_dataframe)
        dataset_model.labels_number = dataset_dataframe.iloc[:, -1].nunique()


def delete_invalid_content(dataset_path: str):
    cleanup_service_folders(dataset_path)
    remove_hidden_files(dataset_path)
    remove_empty_folders(dataset_path)

    # Folders that are using for recognizing datasets
    inviolable_root_folders = [VOC_ROOT_FOLDER]
    root_dataset_content = [*Path(dataset_path).iterdir()]

    only_one_root_path = len(root_dataset_content) == 1
    path_is_folder = os.path.isdir(root_dataset_content[0])
    folder_is_not_inviolable = os.path.split(root_dataset_content[0])[1] not in inviolable_root_folders

    if only_one_root_path and path_is_folder and folder_is_not_inviolable:
        root_folder = str(root_dataset_content[0])
        for file_path in os.listdir(root_folder):
            move(os.path.join(root_folder, file_path), os.path.join(dataset_path, file_path))
        os.rmdir(root_folder)


def cleanup_service_folders(dataset_path: str):
    # List all known service folders
    service_folders = ['__MACOSX']

    for service_folder in service_folders:
        inner_folder_items = Path(dataset_path).rglob(service_folder)
        for item in inner_folder_items:
            if os.path.isdir(item):
                rmtree(item)
            elif os.path.isfile(item):
                os.remove(item)


def remove_hidden_files(dataset_path: str):
    hidden_files = Path(dataset_path).rglob('.*')
    for hidden_file in hidden_files:
        if os.path.isfile(hidden_file):
            os.remove(hidden_file)


def remove_empty_folders(dataset_path: str):
    dataset_structure = list(os.walk(dataset_path))
    # start deleting empty folders from inner ones
    for directory, _, _ in dataset_structure[::-1]:
        if not os.listdir(directory):
            os.rmdir(directory)
