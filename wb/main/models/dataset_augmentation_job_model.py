"""
 OpenVINO DL Workbench
 Class for ORM model describing dataset augmentation job

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
import json
try:
    from typing import TypedDict
except ImportError:
    from typing_extensions import TypedDict

from sqlalchemy import Column, Integer, ForeignKey, Boolean, Float, Text
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.datasets_model import DatasetsModel, DatasetJobData
from wb.main.models.jobs_model import JobsModel


class DatasetAugmentationJobData(TypedDict):
    applyHorizontalFlip: bool
    applyVerticalFlip: bool
    applyErase: bool
    eraseRatio: int
    eraseImages: int
    applyNoise: bool
    noiseRatio: int
    noiseImages: int
    applyImageCorrections: bool
    imageCorrections: str


# pylint: disable=too-many-instance-attributes
class DatasetAugmentationJobModel(JobsModel):
    __tablename__ = 'dataset_augmentation_jobs'
    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.augment_dataset_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    dataset_id = Column(Integer, ForeignKey(DatasetsModel.id), nullable=False)

    horizontal_flip = Column(Boolean, nullable=False, default=False)
    vertical_flip = Column(Boolean, nullable=False, default=False)

    apply_random_erase = Column(Boolean, nullable=False, default=False)
    erase_ratio = Column(Float, nullable=True)
    erase_images = Column(Integer, nullable=True)

    apply_noise_injection = Column(Boolean, nullable=False, default=False)
    noise_ratio = Column(Float, nullable=True)
    noise_images = Column(Integer, nullable=True)

    apply_image_corrections = Column(Boolean, nullable=False, default=False)
    image_corrections = Column(Text, nullable=True)

    dataset = relationship(DatasetsModel, foreign_keys=[dataset_id],
                           backref=backref('dataset_augmentation_job', lazy='subquery', cascade='delete,all',
                                           uselist=False))

    def __init__(self, data: DatasetJobData, augmentation_data: DatasetAugmentationJobData):
        super().__init__(data)
        self.dataset_id = data['datasetId']
        self.vertical_flip = augmentation_data['applyVerticalFlip']
        self.horizontal_flip = augmentation_data['applyHorizontalFlip']
        self.apply_noise_injection = augmentation_data['applyNoise']
        self.apply_random_erase = augmentation_data['applyErase']
        self.erase_images = augmentation_data['eraseImages']
        self.erase_ratio = augmentation_data['eraseRatio']
        self.noise_ratio = augmentation_data['noiseRatio']
        self.noise_images = augmentation_data['noiseImages']
        self.apply_image_corrections = augmentation_data['applyImageCorrections']
        self.image_corrections = json.dumps(augmentation_data['imageCorrections'])

    def json(self) -> dict:
        return {
            **super().json(),
            **self.dataset.json()
        }

    @property
    def augmented_images_count(self) -> int:
        augmented_images_count = 0
        if self.apply_random_erase:
            augmented_images_count += self.erase_images
        if self.apply_noise_injection:
            augmented_images_count += self.noise_images
        if self.horizontal_flip:
            augmented_images_count += 1
        if self.vertical_flip:
            augmented_images_count += 1
        if self.apply_image_corrections:
            augmented_images_count += len(self.image_corrections)
        return augmented_images_count
