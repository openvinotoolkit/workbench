"""
 OpenVINO DL Workbench
 Class for dataset annotator

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
import os
import re
import shutil
from pathlib import Path
from typing import Iterable, Union

import cv2
from datumaro import AnnotationType, Dataset, DatasetItem, LabelCategories
from openvino.tools.accuracy_checker.evaluators import ModelEvaluator
from openvino.tools.accuracy_checker.representation import BaseRepresentation

try:
    from wb.main.shared.constants import ALLOWED_EXTENSIONS_IMG, VOC_ROOT_FOLDER
    from wb.main.shared.utils import find_all_paths_by_exts
    from wb.main.scripts.dataset_annotator.dataset_item_creator import DatasetItemCreatorFactory
    from wb.main.scripts.dataset_annotator.task_to_auto_annotated_dataset_type_mapper import \
        TaskToAutoAnnotatedDatasetTypeMapper
    from wb.main.shared.enumerates import DatasetTypesEnum, TaskEnum
except ImportError as e:
    from dataset_item_creator import DatasetItemCreatorFactory
    from task_to_auto_annotated_dataset_type_mapper import TaskToAutoAnnotatedDatasetTypeMapper
    from shared.constants import ALLOWED_EXTENSIONS_IMG, VOC_ROOT_FOLDER
    from shared.utils import find_all_paths_by_exts
    from shared.enumerates import DatasetTypesEnum, TaskEnum


class _ProgressReporter:
    def __init__(self, total_steps: int, progress_step: int = 1):
        self.prev_progress = 0
        self.total_steps = total_steps
        self.current_step = 0
        self.progress_step = progress_step

    def _log_progress(self):
        print(f'[DATASET ANNOTATOR]: {self.prev_progress}%')

    def next_step(self):
        self.current_step += 1
        progress = int(self.current_step * (100 / self.total_steps))
        if progress - self.prev_progress >= self.progress_step:
            self.prev_progress = progress
            self._log_progress()


class DatasetAnnotator:
    _default_dataset_subset_name = 'test'

    def __init__(self, images_path: Path, task_type: TaskEnum, model_evaluator: ModelEvaluator):
        self._dataset_path = Path(images_path)
        self._task_type = task_type
        self._model_evaluator = model_evaluator

    @property
    def _output_dataset_type(self) -> DatasetTypesEnum:
        dataset_type = TaskToAutoAnnotatedDatasetTypeMapper.get_dataset_type_by_task(self._task_type)
        if not dataset_type:
            raise Exception(f'No dataset type registered for task type {self._task_type.name}')
        return dataset_type

    @property
    def _dataset_images_paths(self) -> Iterable[Path]:
        return find_all_paths_by_exts(
            dir_path=self._dataset_path,
            extensions=ALLOWED_EXTENSIONS_IMG,
            recursive=True,  # TODO Consider specifying path to images directory with respect to dataset format
            result_type=Path
        )

    def _get_image_prediction(self, image_path: Path) -> BaseRepresentation:
        image = cv2.imread(str(image_path))
        predictions = self._model_evaluator.process_single_image(image)
        return predictions

    @staticmethod
    def _create_dataset() -> Dataset:
        return Dataset(categories={
            AnnotationType.label: LabelCategories()
        })

    def create_annotated_dataset(self, output_path: Union[Path, str]) -> Path:
        dataset = self._create_dataset()
        annotation_adapter = DatasetItemCreatorFactory.create_annotation_adapter(self._task_type)

        image_paths = list(self._dataset_images_paths)
        num_images = len(image_paths)
        progress_step = max(1, int(num_images / 100))
        progress_reporter = _ProgressReporter(num_images, progress_step)

        for image_path in image_paths:

            image_annotation = self._get_image_prediction(image_path)
            dataset_item = annotation_adapter.from_annotation(image_path, image_annotation)
            self._add_dataset_category_if_not_exist(dataset, dataset_item)
            dataset.put(dataset_item, subset=self._default_dataset_subset_name)
            progress_reporter.next_step()

        if self._output_dataset_type == DatasetTypesEnum.voc:
            output_path = Path(output_path) / VOC_ROOT_FOLDER / 'VOC2012'

        dataset.export(str(output_path), self._output_dataset_type.value, save_images=True)
        self._post_process_dataset(output_path)
        return output_path

    def _add_dataset_category_if_not_exist(self, dataset: Dataset, dataset_item: DatasetItem):
        dataset_categories: LabelCategories = dataset.categories()[AnnotationType.label]
        for annotation in dataset_item.annotations:
            current_category_id = annotation.label
            category_id, _ = dataset_categories.find(current_category_id)
            if category_id:
                return

            for category_index in range(current_category_id + 1):
                if self._task_type == TaskEnum.object_detection:
                    # Move the index for saving 0 for the background class
                    category_index += 1

                if self._task_type == TaskEnum.semantic_segmentation and category_index == 0:
                    category_name = 'background'
                else:
                    category_name = str(category_index)
                category_id, _ = dataset_categories.find(category_name)
                if category_id is None:
                    dataset_categories.add(category_name)

    def _post_process_dataset(self, dataset_path: Union[Path, str]):
        post_processor_per_task_enum = {
            TaskEnum.object_detection: self._clean_coco_annotations,
            TaskEnum.classification: self._clean_imagenet_annotations,
            TaskEnum.instance_segmentation: self._clean_coco_annotations,
        }

        post_processor = post_processor_per_task_enum.get(self._task_type)

        if not post_processor:
            return

        post_processor(dataset_path)

    @staticmethod
    def _clean_coco_annotations(dataset_path: Union[Path, str]):
        annotations_path = Path(dataset_path) / 'annotations'
        needed_annotations_files_patterns = [r'instances*.json']
        for annotations_staff in annotations_path.iterdir():
            for needed_annotations_file_pattern in needed_annotations_files_patterns:
                if annotations_staff.match(needed_annotations_file_pattern):
                    break
            else:
                if annotations_staff.is_dir():
                    shutil.rmtree(str(annotations_staff))
                else:
                    annotations_staff.unlink()

    @staticmethod
    def _clean_imagenet_annotations(dataset_path: Union[Path, str]):
        dataset_path = Path(dataset_path)
        for sub_path in dataset_path.iterdir():
            if sub_path.is_file() and DatasetAnnotator._is_imagenet_annotation_file(sub_path):
                os.rename(sub_path, dataset_path / 'annotations.txt')

    @staticmethod
    def _is_imagenet_annotation_file(path: Path) -> bool:
        if path.suffix.lower() != '.txt':
            return False
        with path.open() as file_descriptor:
            return all(
                re.match(r'^\S+[ \t]+[0-9]+$', line.rstrip(' \t\r\n'))
                and len(line.split()) == 2
                for line in file_descriptor if line.strip('\r\n')
            )
