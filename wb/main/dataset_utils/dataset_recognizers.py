"""
 OpenVINO DL Workbench
 Dataset adapter classes.

 Copyright (c) 2018-2021 Intel Corporation

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
from pathlib import Path
from typing import Callable

from typing import TextIO

from config.constants import VOC_ANNOTATIONS_FOLDER, VOC_IMAGESETS_FOLDER, VOC_IMAGES_FOLDER
from wb.main.accuracy_utils.yml_templates.registry import register_dataset_recognizer
from wb.main.shared.constants import ALLOWED_EXTENSIONS_IMG
from wb.main.shared.enumerates import TaskEnum, DatasetTypesEnum
from wb.main.shared.utils import find_all_paths_by_exts


class BaseDatasetRecognizer:
    task_type_to_adapter = None

    @staticmethod
    def is_flat(dataset_path: str) -> bool:
        image_paths = [im_path for im_path in find_all_paths_by_exts(dataset_path, ALLOWED_EXTENSIONS_IMG,
                                                                     recursive=True,
                                                                     result_type=Path)]

        reference_path = image_paths[0].parent if image_paths else None

        return all(reference_path == im_path.parent for im_path in image_paths)

    @staticmethod
    def recognize(dataset_path: str) -> bool:
        """Check if the `dataset_path` contains a dataset of type related to this subclass."""
        raise NotImplementedError

    @classmethod
    def provide_adapter(cls, task_type: TaskEnum, dataset_path: str, model_dependent_params: dict = None):
        return cls.task_type_to_adapter[task_type](dataset_path, model_dependent_params)


@register_dataset_recognizer(DatasetTypesEnum.imagenet_txt)
class ImagenetRecognizer(BaseDatasetRecognizer):
    task_type_to_adapter = {}

    @staticmethod
    def is_imagenet_annotation(path: Path) -> bool:
        with open(path, 'r') as fp:
            contents = fp.readlines()
        sample_size = min(10, len(contents))
        samples = [line.split() for line in contents[:sample_size]]
        try:
            for sample in samples:
                int(sample[1])
        except (IndexError, ValueError):
            return False
        return all(len(sample) == 2 for sample in samples)

    @staticmethod
    def recognize(dataset_path: str) -> bool:
        content = list(Path(dataset_path).iterdir())
        is_flat = ImagenetRecognizer.is_flat(dataset_path)
        txt_files = [path for path in content if path.suffix.lower() == '.txt']
        has_imagenet_annotation = any(ImagenetRecognizer.is_imagenet_annotation(txt_file) for txt_file in txt_files)
        return is_flat and has_imagenet_annotation


@register_dataset_recognizer(DatasetTypesEnum.voc)
class VOCRecognizer(BaseDatasetRecognizer):
    task_type_to_adapter = {}

    @staticmethod
    def recognize(dataset_path: str) -> bool:
        voc_folders = {VOC_IMAGES_FOLDER, VOC_ANNOTATIONS_FOLDER, VOC_IMAGESETS_FOLDER}
        voc_folders_present = voc_folders <= {item.name for item in Path(dataset_path).rglob('*') if item.is_dir()}
        return voc_folders_present


@register_dataset_recognizer(DatasetTypesEnum.coco)
class COCORecognizer(BaseDatasetRecognizer):
    task_type_to_adapter = {}

    @staticmethod
    def is_coco_annotation(json_filepath: Path) -> bool:
        with open(json_filepath, 'r') as json_file:
            json_contents = json.load(json_file)
            return all(key in json_contents for key in ('info', 'licenses', 'images', 'annotations'))

    @staticmethod
    def recognize(dataset_path: str) -> bool:
        all_json_paths = find_all_paths_by_exts(dataset_path, ['json'], True, Path)
        has_coco_annotation = any([COCORecognizer.is_coco_annotation(path) for path in all_json_paths])
        return has_coco_annotation


@register_dataset_recognizer(DatasetTypesEnum.common_semantic_segmentation)
class CommonSemanticSegmentationRecognizer(BaseDatasetRecognizer):
    task_type_to_adapter = {}

    @staticmethod
    def recognize(dataset_path: str) -> bool:
        all_json_paths = find_all_paths_by_exts(dataset_path, ['json'], False, Path)
        has_meta = len([p for p in all_json_paths if p.name == 'dataset_meta.json']) == 1
        root_folders = [folder for folder in Path(dataset_path).iterdir() if folder.is_dir()]
        images_dir_count = 0
        for folder in root_folders:
            if all([filename.is_file() for filename in folder.iterdir()]):
                images_dir_count += 1
        matching_folders = {'images', 'masks'} <= {folder.name.lower() for folder in root_folders}
        return has_meta and matching_folders and images_dir_count == 2


@register_dataset_recognizer(DatasetTypesEnum.common_super_resolution)
class CommonSuperResolutionRecognizer(BaseDatasetRecognizer):
    task_type_to_adapter = {}

    @staticmethod
    def recognize(dataset_path: str) -> bool:
        key_folders_present = {'LR', 'HR'} <= {item.name for item in Path(dataset_path).iterdir() if item.is_dir()}
        return key_folders_present


class LabelledFacesRecognizer(BaseDatasetRecognizer):
    task_type_to_adapter = {}
    TARGET_LENGTH = None

    @classmethod
    def could_be_the_file_annotations(cls, file_extension: str) -> bool:
        return file_extension in ('.txt', '.csv')

    @classmethod
    def annotation_file_check(cls, path: Path) -> bool:
        annotation_checker = cls.get_annotation_file_checker(path)
        with open(path, 'r') as target_file:
            return annotation_checker(target_file)

    @classmethod
    def csv_annotation_file_check(cls, target_file: TextIO) -> bool:
        return len(target_file.readline().rstrip(',').split(',')) == cls.TARGET_LENGTH

    @classmethod
    def txt_annotation_file_check(cls, target_file: TextIO) -> bool:
        return len(target_file.readline().rstrip().replace('\t', ' ').split(' ')) == cls.TARGET_LENGTH

    @classmethod
    def get_annotation_file_checker(cls, file_path: Path) -> Callable[[TextIO], bool]:
        annotation_file_checkers = {
            '.txt': cls.txt_annotation_file_check,
            '.csv': cls.csv_annotation_file_check,
        }
        return annotation_file_checkers[file_path.suffix]

    @classmethod
    def recognize(cls, dataset_path: str) -> bool:
        root_contents = [*Path(dataset_path).iterdir()]
        if len(root_contents) != 2:
            return False

        has_annotation = False
        has_data = False
        for folder in root_contents:
            if not folder.is_dir():
                continue
            folder_contents = [*folder.iterdir()]
            if all(path.is_file() for path in folder_contents):
                has_annotation = any(cls.annotation_file_check(target)
                                     for target in folder_contents
                                     if cls.could_be_the_file_annotations(target.suffix))
            elif all(path.is_dir() for path in folder_contents):
                has_data = True
        return has_annotation and has_data


@register_dataset_recognizer(DatasetTypesEnum.lfw)
class LFWRecognizer(LabelledFacesRecognizer):
    """
    Dataset format:
         | - annotation
             | - pairs.txt (2 columns)
             | - Optional[landmarks.txt] (11 columns)
         | - lfw
             | - Batman
                 | - Batman_0001.image
             ...
    """
    task_type_to_adapter = {}
    TARGET_LENGTH = 2


@register_dataset_recognizer(DatasetTypesEnum.vgg_face2)
class VGGFace2Recognizer(LabelledFacesRecognizer):
    """
    Dataset format:
         | - bb_landmark
             | - landmark.csv (11 columns)
             | - Optional[bbox.csv] (5 columns)
         | - test
             | - n{ID}
                 | - n{ID}_0001.image
             ...
    """
    task_type_to_adapter = {}
    TARGET_LENGTH = 11


@register_dataset_recognizer(DatasetTypesEnum.wider_face)
class WiderFaceRecognizer(LabelledFacesRecognizer):
    """
    Dataset format:
         | - annotations
             | - annotation.txt (1 column)
         | - images
             | - scene_{n}
                 | - scene_{n}.image
             ...
    """

    task_type_to_adapter = {}
    TARGET_LENGTH = 1


@register_dataset_recognizer(DatasetTypesEnum.open_images)
class OpenImagesRecognizer(BaseDatasetRecognizer):
    task_type_to_adapter = {}

    @staticmethod
    def check_annotation(target_path: Path, target_length: int) -> bool:
        with target_path.open('r') as target_file:
            return len(target_file.readline().rstrip(',').split(',')) == target_length

    @classmethod
    def recognize(cls, dataset_path: str) -> bool:
        annotation_candidates = [im_path for im_path in find_all_paths_by_exts(dataset_path, ['csv'],
                                                                               recursive=True,
                                                                               result_type=Path)]

        has_annotation = any(OpenImagesRecognizer.check_annotation(target, 13)
                             for target in annotation_candidates)
        has_labels = any(OpenImagesRecognizer.check_annotation(target, 2)
                         for target in annotation_candidates)
        flat_images = cls.is_flat(dataset_path)

        return has_annotation and has_labels and flat_images


@register_dataset_recognizer(DatasetTypesEnum.not_annotated)
class NotAnnotatedRecognizer(BaseDatasetRecognizer):
    task_type_to_adapter = {}

    @staticmethod
    def recognize(dataset_path: str) -> bool:
        extensions = set(path.suffix for path in Path(dataset_path).rglob('*') if path.is_file())
        return not extensions & {'.txt', '.xml', '.json'}
