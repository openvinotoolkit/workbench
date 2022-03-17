"""
 OpenVINO DL Workbench
 Class for ORM model described a Dataset

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
import os
from pathlib import Path
from typing import Optional, List, Any, Dict

from sqlalchemy import Integer, Column, ForeignKey, event, Boolean
from sqlalchemy.orm import backref, relationship

from config.constants import UPLOAD_FOLDER_DATASETS
from wb.extensions_factories.database import get_db_session_for_app
from wb.main.accuracy_utils.yml_templates import ConfigRegistry
from wb.main.dataset_utils.dataset_adapters import BaseImageDatasetAdapter
from wb.main.enumerates import StatusEnum, AcceptableFileSizesMb, CSVDatasetSeparatorEnum
from wb.main.models.artifacts_model import ArtifactsModel, TooLargePayloadException
from wb.main.models.enumerates import DATASET_TYPES_ENUM_SCHEMA
from wb.main.models.jobs_model import JobData
from wb.main.shared.constants import ALLOWED_EXTENSIONS_IMG
from wb.main.shared.enumerates import DatasetTypesEnum, TaskEnum
from wb.main.shared.utils import find_all_paths_by_exts
from wb.main.utils.utils import chmod_dir_recursively, remove_dir, FileSizeConverter, create_empty_dir


class DatasetJobData(JobData):
    datasetId: int
    resultDatasetId: Optional[int]


class TextDatasetJobData(DatasetJobData):
    columns: List[int]
    header: bool
    encoding: str
    separator: CSVDatasetSeparatorEnum
    task_type: TaskEnum


class DatasetsModel(ArtifactsModel):
    __tablename__ = 'datasets'

    __mapper_args__ = {
        'polymorphic_identity': __tablename__
    }

    id = Column(Integer, ForeignKey('artifacts.id'), primary_key=True)
    converted_from_id = Column(Integer, ForeignKey(f'{__tablename__}.id'), nullable=True)

    dataset_type = Column(DATASET_TYPES_ENUM_SCHEMA, nullable=True)
    number_images = Column(Integer, default=0, nullable=False)
    labels_number = Column(Integer, nullable=True)
    max_label_id = Column(Integer, nullable=True)
    is_auto_annotated = Column(Boolean, nullable=False, default=False)
    is_internal = Column(Boolean, nullable=False, default=False)

    task_types = relationship('DatasetTasksModel', lazy='dynamic', cascade='delete,all')
    converted_from = relationship('DatasetsModel', foreign_keys=[converted_from_id], remote_side=[id],
                                  backref=backref('converted_to', lazy='subquery', cascade='delete,all',
                                                  uselist=False), cascade='delete,all')

    # Relationship typings
    wait_dataset_upload_job: Optional['WaitDatasetUploadJobsModel']
    extract_dataset_job: Optional['ExtractDatasetJobsModel']
    extract_text_dataset_job: Optional['ExtractTextDatasetJobsModel']
    recognize_dataset_job: Optional['RecognizeDatasetJobsModel']
    convert_dataset_job: Optional['ConvertDatasetJobsModel']
    validate_dataset_job: Optional['ValidateDatasetJobsModel']
    validate_text_dataset_job: Optional['ValidateTextDatasetJobsModel']
    dataset_augmentation_job: Optional['DatasetAugmentationJobModel']
    accuracy_reports: Optional[List['AccuracyReportModel']]
    converted_to: Optional['DatasetsModel']

    def json(self):
        return {
            **super().json(),
            'type': self.dataset_type.value if self.dataset_type else None,
            'originalType': self.original_type,
            'readiness': self.status.value,
            'labelsNumber': self.labels_number,
            'maxLabelId': self.max_label_id,
            'numberOfImages': self.number_images,
            'tasks': [task_record.task_type.value for task_record in self.task_types],
            **(self._nlp_specific_json_data() if self.is_nlp else self._cv_specific_json_data())
        }

    def _cv_specific_json_data(self) -> Dict[str, Any]:
        return {
            'singleImagePath': self.single_file_path,
        }

    def _nlp_specific_json_data(self) -> Dict[str, Any]:
        return {
            'csvFilePath': self.single_file_path,
        }

    @property
    def original_and_converted(self) -> List['DatasetsModel']:
        if self.converted_to is None:
            return [self]
        return [self, self.converted_to]

    @staticmethod
    def is_size_valid(size: float) -> bool:
        return size <= AcceptableFileSizesMb.DATASET.value

    @staticmethod
    def remove_dataset_files(dataset_id: int):
        remove_dir(os.path.join(UPLOAD_FOLDER_DATASETS, str(dataset_id)))

    @property
    def is_nlp(self):
        return bool(self.dataset_type and self.dataset_type.is_nlp())

    @property
    def original_type(self) -> Optional[DatasetTypesEnum]:
        if not self.converted_from:
            return None

        return self.converted_from.dataset_type.value if self.converted_from.dataset_type else None

    @property
    def dataset_data_dir(self) -> Optional[str]:
        if not self.dataset_type or not Path(self.path).exists() or self.status != StatusEnum.ready:
            return None

        if self.is_nlp:
            return self.path

        return self._dataset_images_dir

    @property
    def _dataset_images_dir(self) -> Optional[str]:
        dataset_recognizer = ConfigRegistry.dataset_recognizer_registry[self.dataset_type]
        if self.dataset_type == DatasetTypesEnum.not_annotated:
            task_type = None
        elif not self.task_types or not list(self.task_types):
            return None
        else:
            task_type = list(self.task_types)[0].task_type
        image_dataset_adapter: BaseImageDatasetAdapter = dataset_recognizer.provide_adapter(task_type, self.path)
        dataset_images_dir_path: Path = image_dataset_adapter.images_dir

        if self.dataset_type in [DatasetTypesEnum.lfw, DatasetTypesEnum.vgg_face2]:
            return str(next(dataset_images_dir_path.iterdir()))

        return str(dataset_images_dir_path)

    @property
    def single_file_path(self) -> Optional[str]:
        if self.is_nlp:
            if not self.dataset_data_dir:
                return None
            return next(map(str, Path(self.dataset_data_dir).iterdir()), None)

        dataset_images_dir = self.dataset_data_dir
        if not dataset_images_dir:
            return None
        images = find_all_paths_by_exts(dir_path=dataset_images_dir, extensions=ALLOWED_EXTENSIONS_IMG,
                                        recursive=True)
        return next(images, None)

    def get_dataset_img(self, img_name: str) -> Optional[str]:
        dataset_images_dir = self.dataset_data_dir
        if not dataset_images_dir:
            return None
        return os.path.join(dataset_images_dir, img_name)

    @property
    def number_samples(self):
        return self.number_images

    @number_samples.setter
    def number_samples(self, value):
        self.number_images = value

    @classmethod
    def create_dataset(
            cls,
            dataset_name: str,
            files: Optional[dict],
            upload_path: str,
            is_auto_annotated: bool = False,
            dataset_type: Optional[DatasetTypesEnum] = None,
            is_internal: bool = False
    ) -> 'DatasetsModel':
        if files:
            dataset_size_bytes = sum([f['size'] for f in files.values()])
            dataset_size = FileSizeConverter.bytes_to_mb(dataset_size_bytes)
            if not cls.is_size_valid(dataset_size):
                raise TooLargePayloadException('Dataset exceeds maximum acceptable size')
        dataset = cls(name=dataset_name)
        dataset.is_auto_annotated = is_auto_annotated
        dataset.is_internal = is_auto_annotated or is_internal
        # need to call write method before assigning path, as id is required
        dataset.write_record(get_db_session_for_app())
        dataset.path = os.path.join(upload_path, str(dataset.id))
        dataset.dataset_type = dataset_type
        dataset.write_record(get_db_session_for_app())
        create_empty_dir(os.path.join(dataset.path))
        return dataset


@event.listens_for(DatasetsModel, 'after_update', propagate=True)
def set_permission_for_dataset(unused_mapper, unused_connection, dataset: DatasetsModel):
    if dataset.status != StatusEnum.ready or not dataset.path:
        return
    chmod_dir_recursively(dataset.path)
