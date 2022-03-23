"""
 OpenVINO DL Workbench
 Class for creation job for dataset augmentation

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
import math
import os
import random
from contextlib import closing
from typing import List, Tuple

import cv2
import numpy as np
from PIL import Image, ImageEnhance

from sqlalchemy.orm import Session

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.datasets.base_dataset_job import BaseDatasetJob
from wb.main.jobs.datasets.dataset_augmentation_job_state import DatasetAugmentationJobStateSubject
from wb.main.jobs.interfaces.job_observers import AugmentDatasetDBObserver
from wb.main.models import DatasetsModel, DatasetAugmentationJobModel

from wb.main.utils.utils import get_size_of_files


class DatasetAugmentationJob(BaseDatasetJob):
    job_type = JobTypesEnum.augment_dataset_type
    _job_model_class = DatasetAugmentationJobModel
    _job_state_subject = DatasetAugmentationJobStateSubject

    def _create_and_attach_observers(self):
        self._job_state_subject = DatasetAugmentationJobStateSubject(self.job_id)
        dataset_db_observer = AugmentDatasetDBObserver(job_id=self.job_id, mapper_class=self._job_model_class)
        self._job_state_subject.attach(dataset_db_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(log='Starting Dataset Augmentation job.', status=StatusEnum.running,
                                             progress=0)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            dataset_augmentation_job: DatasetAugmentationJobModel = self.get_job_model(session)
            dataset: DatasetsModel = dataset_augmentation_job.dataset
            progress = dataset_augmentation_job.progress
            for file in dataset.files:
                if dataset_augmentation_job.apply_random_erase:
                    self._erase_area(file.path, dataset_augmentation_job.erase_images,
                                     dataset_augmentation_job.erase_ratio)
                if dataset_augmentation_job.apply_noise_injection:
                    self._sp_noise(file.path, dataset_augmentation_job.noise_images,
                                   dataset_augmentation_job.noise_ratio)
                self._flip_image(file.path, dataset_augmentation_job.horizontal_flip,
                                 dataset_augmentation_job.vertical_flip)
                if dataset_augmentation_job.apply_image_corrections:
                    image_corrections = json.loads(dataset_augmentation_job.image_corrections)
                    self._change_colorspace(file.path, image_corrections)
                progress += 100 / len(dataset.files)
                self._job_state_subject.update_state(progress=progress)
        self._job_state_subject.set_images(dataset_augmentation_job.augmented_images_count)
        size = get_size_of_files(dataset.path)
        self._job_state_subject.set_size(size)
        self._job_state_subject.update_state(log='Finished Dataset Augmentation job.', status=StatusEnum.ready,
                                             progress=100)

    @staticmethod
    def _split_img_path(file_path: str) -> Tuple[str, str, str]:
        base_file_path = os.path.basename(file_path)
        img_name, img_ext = os.path.splitext(base_file_path)
        return os.path.dirname(file_path), img_name, img_ext

    @staticmethod
    def _erase_area(img_path: str, images_num: int, erase_percent: int):
        image = Image.open(img_path).convert('RGB')
        dataset_path, img_name, img_ext = DatasetAugmentationJob._split_img_path(img_path)
        original_width, original_height = image.size
        cutout_w = math.ceil(original_width * (erase_percent / 100))
        cutout_h = math.ceil(original_height * (erase_percent / 100))
        rect_size = (cutout_w, cutout_h)
        for i in range(images_num):
            im_copy = image.copy()
            x_coord = random.randint(0, original_width - cutout_w)  # nosec: blacklist
            y_coord = random.randint(0, original_height - cutout_h)  # nosec: blacklist
            rect = Image.new('RGB', rect_size, (255, 255, 255))
            im_copy.paste(rect, (x_coord, y_coord))
            im_copy.save(os.path.join(dataset_path, f'{img_name}_erased_{i}{img_ext}'))

    @staticmethod
    def _flip_image(img_path: str, horizontal: bool, vertical: bool):
        image = cv2.imread(img_path)
        dataset_path, img_name, img_ext = DatasetAugmentationJob._split_img_path(img_path)
        if horizontal:
            output = image.copy()
            h_flipped_image = cv2.flip(output, 1)
            cv2.imwrite(os.path.join(dataset_path, f'{img_name}_h_flip{img_ext}'), h_flipped_image)

        if vertical:
            output = image.copy()
            v_flipped_image = cv2.flip(output, 0)
            cv2.imwrite(os.path.join(dataset_path, f'{img_name}_v_flip{img_ext}'), v_flipped_image)

    @staticmethod
    def _sp_noise(img_path: str, images_num: int, prob: int):
        image = cv2.imread(img_path)
        dataset_path, img_name, img_ext = DatasetAugmentationJob._split_img_path(img_path)
        for i in range(images_num):
            output = image.copy()
            black = np.array([0, 0, 0], dtype='uint8')
            white = np.array([255, 255, 255], dtype='uint8')
            probs = np.random.random_sample(output.shape[:2])
            output[probs < ((prob / 100) / 2)] = black
            output[probs > 1 - ((prob / 100) / 2)] = white
            cv2.imwrite(os.path.join(dataset_path, f'{img_name}_noised_{i}{img_ext}'), output)

    @staticmethod
    def _change_colorspace(img_path: str, changes: List[dict]):
        image = Image.open(img_path).convert('RGB')
        dataset_path, img_name, img_ext = DatasetAugmentationJob._split_img_path(img_path)
        output = image.copy()
        for index, change in enumerate(changes):
            brightness_enhancer = ImageEnhance.Brightness(output)
            bright_output = brightness_enhancer.enhance(change['brightness'])
            contrast_enhancer = ImageEnhance.Contrast(bright_output)
            output = contrast_enhancer.enhance(change['contrast'])
            output.save(os.path.join(dataset_path, f'{img_name}_colorspace_{index}{img_ext}'))
