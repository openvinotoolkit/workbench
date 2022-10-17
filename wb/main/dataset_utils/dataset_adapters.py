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
import os
import re
from pathlib import Path
from typing import ClassVar, Optional, Tuple, Union, Callable, List, Dict, Any, Iterator, Type, Generator, TextIO

import pandas
from pandas import DataFrame


from config.constants import (LFW_PAIRS_LENGTH, LNDREID_LANDMARK_LENGTH, VGGFACE2_BBOX_LENGTH, VOC_ANNOTATIONS_FOLDER,
                              VOC_IMAGESETS_FOLDER, VOC_IMAGES_FOLDER, VOC_MASKS_FOLDER)
from wb.error.inconsistent_upload_error import InconsistentDatasetError
from wb.main.accuracy_utils.yml_abstractions.annotation import Annotation
from wb.main.dataset_utils.dataset_recognizers import COCORecognizer, CommonSemanticSegmentationRecognizer, \
    CommonSuperResolutionRecognizer, ImagenetRecognizer, LFWRecognizer, NotAnnotatedRecognizer, OpenImagesRecognizer, \
    VGGFace2Recognizer, \
    VOCRecognizer, \
    WiderFaceRecognizer
from wb.main.enumerates import AnnotationConverterEnum, CSVDatasetSeparatorEnum
from wb.main.shared.constants import ALLOWED_EXTENSIONS_IMG
from wb.main.shared.enumerates import TaskEnum
from wb.main.shared.utils import find_all_paths_by_exts


def register_dataset_adapter(task_type: Optional[TaskEnum], recognizer: ClassVar):
    def decorate(cls):
        recognizer.task_type_to_adapter[task_type] = cls
        return cls

    return decorate


class BaseImageDatasetAdapter:
    converter = None
    supported_task_specific_variables = []

    def __init__(self, dataset_path: str, task_specific_variables: dict = None):
        self.dataset_path = Path(dataset_path)
        if not self.dataset_path.exists():
            raise FileNotFoundError(self.dataset_path)
        if not self.dataset_path.is_dir():
            raise NotADirectoryError(self.dataset_path)

        self.task_specific_variables = task_specific_variables or {}

        self.images_dir = self.get_images_dir()
        self.params = self.get_params()

    def get_images_dir(self) -> Path:
        """Return absolute path to the directory containing images."""
        raise NotImplementedError

    def get_task_specific_constants(self) -> dict:
        """
        Return task-specific annotation conversion params embedded in the dataset structure.
        These parameters are not exposed to the user.
        """
        raise NotImplementedError

    def get_task_specific_variables(self) -> dict:
        """
        Return task-specific annotation conversion params provided by the user.
        Since these parameters are exposed to the user, filtering is performed as a sefety measure.
        """
        return {
            key: value
            for key, value in self.task_specific_variables.items()
            if key in self.supported_task_specific_variables
        }

    def get_params(self) -> dict:
        """Return all annotation conversion params."""
        params = {
            **self.get_task_specific_constants(),
            **self.get_task_specific_variables(),
            'converter': self.converter,
            'images_dir': self.images_dir,  # Used by Accuracy Checker for content checking.
        }
        dataset_meta_path = self.get_dataset_meta()
        if dataset_meta_path:
            params['dataset_meta_file'] = dataset_meta_path
        return params

    def abs_path(self, relative_path: str) -> Path:
        absolute_path = self.dataset_path / relative_path
        if not absolute_path.exists():
            raise InconsistentDatasetError('Cannot find {}'.format(relative_path))
        return absolute_path

    def to_annotation(self) -> dict:
        serializable_params = {
            key: value if isinstance(value, (str, bool, int, float)) else str(value)
            for key, value in self.params.items()
        }
        return {
            'data_source': str(self.images_dir),
            'annotation': Annotation(**serializable_params),
        }

    def get_dataset_meta(self) -> Union[Path, None]:
        """Return dataset meta file path, if present."""
        try:
            return next(self.dataset_path.rglob('dataset_meta.json'))
        except StopIteration:
            return None

    def get_default_label_data(self) -> Tuple[int, int]:
        """
        Return a tuple with the number of labels and the max label ID of the dataset.

        Should return hardcoded values that are default for this type of dataset
        or read labels from the file specific for this type of dataset, if it is present.
        """
        raise NotImplementedError

    def get_label_data(self) -> Tuple[int, int]:
        """
        Return a tuple with the number of labels and the max label ID of the dataset.

        Uses values from `dataset_meta.json`, if it is present and contains labels,
        or uses values from `get_default_labels_number_and_max_id`.
        """
        dataset_meta_path = self.params.get('dataset_meta_file')
        if dataset_meta_path:
            with open(str(dataset_meta_path)) as file:
                try:
                    dataset_meta = json.load(file)
                except json.JSONDecodeError:
                    raise InconsistentDatasetError('Malformed "dataset_meta.json", not JSON.')
            if 'label_map' in dataset_meta:
                return len(dataset_meta['label_map']), max(dataset_meta['label_map'].keys())
            if 'labels' in dataset_meta:
                labels_number = len(dataset_meta['labels'])
                return labels_number, labels_number
        return self.get_default_label_data()


class ImagenetBaseAdapter(BaseImageDatasetAdapter):

    # For imagenet_txt, all images are contained in a single subfoler or dataset root
    def get_images_dir(self) -> Path:
        for subpath in self.dataset_path.iterdir():
            if subpath.is_dir() and all(item.is_file() for item in subpath.iterdir()):
                return subpath
        return self.dataset_path

    def get_task_specific_constants(self) -> dict:
        pass

    def get_default_label_data(self) -> Tuple[int, int]:
        pass


@register_dataset_adapter(TaskEnum.classification, ImagenetRecognizer)
class ImagenetClassificationAdapter(ImagenetBaseAdapter):
    converter = AnnotationConverterEnum.imagenet.value
    supported_task_specific_variables = ['has_background']

    def get_default_label_data(self) -> Tuple[int, int]:
        labels_file = self.params.get('labels_file')
        if labels_file:
            with open(str(labels_file)) as file:
                num_labels = sum(1 for line in file if line.strip())  # One label per line.
            return num_labels, num_labels  # Max ID is always the same as the number of labels for ImageNet.
        return 1000, 1000

    def get_task_specific_constants(self) -> dict:
        params = {
            'annotation_file': self.get_annotation_file_path(),
        }
        labels_file = self.get_labels_file()
        if labels_file:
            params['labels_file'] = labels_file
        return params

    def get_annotation_file_path(self) -> Path:
        annotation_file_paths = [path for path in self.dataset_path.iterdir() if self.is_imagenet_annotation_file(path)]
        if not annotation_file_paths:
            raise InconsistentDatasetError('Cannot find annotation file.')
        if len(annotation_file_paths) > 1:
            raise InconsistentDatasetError(
                'Too many annotation files: {}.'.format([path.name for path in annotation_file_paths]))
        return annotation_file_paths[0]

    @staticmethod
    def is_imagenet_annotation_file(path: Path) -> bool:
        if not path.is_file() or path.suffix.lower() != '.txt':
            return False
        with open(str(path)) as file:
            return all(re.match(r'^\S+[ \t]+[0-9]+$', line.rstrip(' \t\r\n'))
                       and len(line.split()) == 2
                       for line in file if line.strip('\r\n'))

    def get_labels_file(self) -> Union[Path, None]:
        try:
            return next(self.dataset_path.rglob('synset_words.txt'))
        except StopIteration:
            return None


@register_dataset_adapter(TaskEnum.custom, ImagenetRecognizer)
class ImagenetCustomAdapter(ImagenetClassificationAdapter):
    converter = AnnotationConverterEnum.custom.value


@register_dataset_adapter(TaskEnum.inpainting, ImagenetRecognizer)
class ImagenetInpaintingAdapter(ImagenetBaseAdapter):
    converter = AnnotationConverterEnum.inpainting.value

    def get_params(self) -> dict:
        params = super().get_params()
        params.pop('dataset_meta_file', None)
        return params

    def get_task_specific_constants(self) -> dict:
        return {}

    def get_default_label_data(self) -> Tuple[int, int]:
        return 0, 0


@register_dataset_adapter(TaskEnum.style_transfer, ImagenetRecognizer)
class ImagenetStyleTransferAdapter(ImagenetBaseAdapter):
    converter = AnnotationConverterEnum.style_transfer.value

    def get_params(self) -> dict:
        params = super().get_params()
        params.pop('dataset_meta_file', None)
        return params

    def get_task_specific_constants(self) -> dict:
        return {}

    def get_default_label_data(self) -> Tuple[int, int]:
        return 0, 0


class VOCBaseAdapter(BaseImageDatasetAdapter):
    imageset_dir = None

    @property
    def voc_root(self) -> Optional[Path]:
        """Find the root containing 3 essential VOC folders"""
        voc_folders = {VOC_IMAGES_FOLDER, VOC_ANNOTATIONS_FOLDER, VOC_IMAGESETS_FOLDER}
        folders = [self.dataset_path, *[item for item in self.dataset_path.rglob('*') if item.is_dir()]]
        for folder in folders:
            if voc_folders <= {item.name for item in folder.iterdir() if item.is_dir()}:
                return folder
        raise InconsistentDatasetError('Cannot find VOC root folder')

    def get_images_dir(self) -> Path:
        try:
            return self.abs_path(f'{self.voc_root}/{VOC_IMAGES_FOLDER}')
        except InconsistentDatasetError:
            raise InconsistentDatasetError('Cannot find images folder for this dataset')

    def get_task_specific_constants(self) -> dict:
        pass

    def get_default_label_data(self) -> Tuple[int, int]:
        return 20, 20

    def get_labelmap_file(self) -> Optional[Path]:
        target_folder = self.abs_path(f'{self.voc_root}')
        target_path = target_folder / 'labelmap.txt'
        if target_path.is_file():
            return target_path
        return None

    def get_imageset_file(self) -> Optional[Path]:
        image_sets_folder = f'{self.voc_root}/{VOC_IMAGESETS_FOLDER}'
        try:
            path_to_dir = self.abs_path(os.path.join(image_sets_folder, self.imageset_dir))
        except InconsistentDatasetError:
            path_to_dir = self.abs_path(image_sets_folder)

        for filename in ('val.txt', 'test.txt', 'train.txt', 'trainval.txt'):
            path = path_to_dir / filename
            if path.is_file():
                return path
        raise InconsistentDatasetError('Cannot find an imageset file for this dataset.')


@register_dataset_adapter(TaskEnum.object_detection, VOCRecognizer)
class VOCDetectionAdapter(VOCBaseAdapter):
    converter = AnnotationConverterEnum.voc_detection.value
    supported_task_specific_variables = ['has_background']
    imageset_dir = 'Main'

    def get_task_specific_constants(self) -> dict:
        return {
            'imageset_file': self.get_imageset_file(),
            'annotations_dir': self.abs_path(f'{self.voc_root}/{VOC_ANNOTATIONS_FOLDER}'),
        }


@register_dataset_adapter(TaskEnum.semantic_segmentation, VOCRecognizer)
class VOCSegmentationAdapter(VOCBaseAdapter):
    converter = AnnotationConverterEnum.voc_segmentation.value
    imageset_dir = 'Segmentation'

    def get_task_specific_constants(self) -> dict:
        result = {
            'imageset_file': self.get_imageset_file(),
            'mask_dir': self.abs_path(f'{self.voc_root}/{VOC_MASKS_FOLDER}'),
        }
        labelmap_file = self.get_labelmap_file()
        if labelmap_file:
            result['labelmap_file'] = labelmap_file
        return result

    def to_annotation(self) -> dict:
        result = super().to_annotation()
        result['additional_data_source'] = str(self.abs_path(f'{self.voc_root}/{VOC_MASKS_FOLDER}'))
        return result


@register_dataset_adapter(TaskEnum.inpainting, VOCRecognizer)
class VOCInpaintingAdapter(VOCBaseAdapter):
    converter = AnnotationConverterEnum.inpainting.value
    supported_task_specific_variables = []
    imageset_dir = 'Main'

    def get_params(self) -> dict:
        params = super().get_params()
        params.pop('dataset_meta_file', None)
        return params

    def get_task_specific_constants(self) -> dict:
        return {}


@register_dataset_adapter(TaskEnum.style_transfer, VOCRecognizer)
class VOCStyleTransferAdapter(VOCBaseAdapter):
    converter = AnnotationConverterEnum.style_transfer.value
    imageset_dir = 'Main'

    def get_params(self) -> dict:
        params = super().get_params()
        params.pop('dataset_meta_file', None)
        return params

    def get_task_specific_constants(self) -> dict:
        return {}


@register_dataset_adapter(TaskEnum.custom, VOCRecognizer)
class VocCustomAdapter(VOCDetectionAdapter):
    converter = AnnotationConverterEnum.custom.value


class COCOBaseAdapter(BaseImageDatasetAdapter):
    annotation_subset = None

    def get_images_dir(self) -> Path:
        image_paths = find_all_paths_by_exts(self.dataset_path, ALLOWED_EXTENSIONS_IMG, True, Path)
        try:
            image_path = next(image_paths)
            return image_path.parent
        except StopIteration:
            raise InconsistentDatasetError(
                'Cannot find any images of supported types: {}.'.format(ALLOWED_EXTENSIONS_IMG))

    def get_task_specific_constants(self) -> dict:
        pass

    def get_default_label_data(self) -> Tuple[int, int]:
        with open(str(self.get_annotation_file_path())) as file:
            categories = json.load(file)['categories']
            return len(categories), max(c['id'] for c in categories)

    def get_annotation_file_path(self) -> Path:
        json_paths = find_all_paths_by_exts(self.dataset_path, ['json'], True, Path)
        annotation_file_paths = {path.name.split('_')[0]: path
                                 for path in json_paths if self.is_suitable_annotation_file(path)}
        if not annotation_file_paths:
            raise InconsistentDatasetError('Cannot find annotation file.')

        if not self.annotation_subset:
            return list(annotation_file_paths.values())[0]
        return annotation_file_paths.get(self.annotation_subset, None)

    @classmethod
    def is_suitable_annotation_file(cls, path: Path):
        try:
            with open(str(path)) as file:
                annotation_file_content = json.load(file)
                annotation_keys = annotation_file_content['annotations'][0].keys()
                return (
                        {'annotations', 'categories', 'images'} <= set(annotation_file_content.keys())
                        and cls.check_annotation_file(annotation_keys)
                )
        except (IsADirectoryError, json.JSONDecodeError, KeyError, IndexError, AttributeError):
            return False

    @staticmethod
    def check_annotation_file(annotation_keys):
        raise NotImplementedError


@register_dataset_adapter(TaskEnum.object_detection, COCORecognizer)
class COCODetectionAdapter(COCOBaseAdapter):
    converter = AnnotationConverterEnum.mscoco_detection.value
    supported_task_specific_variables = ['has_background', 'use_full_label_map']
    annotation_subset = 'instances'

    def get_task_specific_constants(self) -> dict:
        result = {}
        annotation_file = self.get_annotation_file_path()
        if annotation_file:
            result['annotation_file'] = annotation_file

        return result

    @staticmethod
    def check_annotation_file(annotation_keys):
        return 'bbox' in annotation_keys and 'keypoints' not in annotation_keys


@register_dataset_adapter(TaskEnum.instance_segmentation, COCORecognizer)
class COCOSegmentationAdapter(COCOBaseAdapter):
    converter = AnnotationConverterEnum.mscoco_mask_rcnn.value
    supported_task_specific_variables = ['has_background', 'use_full_label_map']
    annotation_subset = 'instances'

    def get_task_specific_constants(self) -> dict:
        result = {}
        annotation_file = self.get_annotation_file_path()
        if annotation_file:
            result['annotation_file'] = annotation_file

        return result

    @staticmethod
    def check_annotation_file(annotation_keys):
        return 'bbox' in annotation_keys and 'segmentation' in annotation_keys and 'keypoints' not in annotation_keys


@register_dataset_adapter(TaskEnum.inpainting, COCORecognizer)
class COCOInpaintingAdapter(COCOBaseAdapter):
    converter = AnnotationConverterEnum.inpainting.value

    def get_params(self) -> dict:
        params = super().get_params()
        params.pop('dataset_meta_file', None)
        return params

    def get_task_specific_constants(self) -> dict:
        return {}

    @staticmethod
    def check_annotation_file(annotation_keys):
        return True


@register_dataset_adapter(TaskEnum.style_transfer, COCORecognizer)
class COCOStyleTransferAdapter(COCOBaseAdapter):
    converter = AnnotationConverterEnum.style_transfer.value

    def get_params(self) -> dict:
        params = super().get_params()
        params.pop('dataset_meta_file', None)
        return params

    def get_task_specific_constants(self) -> dict:
        return {}

    @staticmethod
    def check_annotation_file(annotation_keys):
        return True


@register_dataset_adapter(TaskEnum.custom, COCORecognizer)
class COCOCustomAdapter(COCOBaseAdapter):
    converter = AnnotationConverterEnum.custom.value

    def get_task_specific_constants(self) -> dict:
        return {
            'annotation_file': self.get_annotation_file_path(),
        }

    @staticmethod
    def check_annotation_file(annotation_keys):
        return True


class CommonSemanticSegmentationBaseAdapter(BaseImageDatasetAdapter):

    def get_images_dir(self) -> Path:
        return self.images_dir_name

    @property
    def images_dir_name(self) -> Path:
        """Return absolute path to the directory containing images."""
        candidate_folders = [folder for folder in self.dataset_path.iterdir() if folder.name.lower() == 'images']
        return next(iter(candidate_folders))

    def get_task_specific_constants(self) -> dict:
        pass

    def get_extension(self, directory: str):
        paths = find_all_paths_by_exts(self.abs_path(directory), ALLOWED_EXTENSIONS_IMG, False, Path)
        try:
            path = next(paths)
            return path.suffix
        except StopIteration:
            raise InconsistentDatasetError(
                'Cannot find any images of supported types: {} in directory "{}"'.format(
                    ALLOWED_EXTENSIONS_IMG, directory))

    def get_dataset_meta(self) -> Path:
        try:
            dataset_meta_path = next(self.dataset_path.rglob('dataset_meta.json'))
        except StopIteration:
            raise InconsistentDatasetError('Required "dataset_meta.json" file not found.')
        with open(str(dataset_meta_path)) as file:
            try:
                dataset_meta = json.load(file)
            except json.JSONDecodeError:
                raise InconsistentDatasetError('Malformed "dataset_meta.json", not JSON.')
        dataset_meta_keys = set(dataset_meta.keys())
        if not dataset_meta_keys & {'label_map', 'labels'} or 'segmentation_colors' not in dataset_meta_keys:
            raise InconsistentDatasetError(
                'Malformed "dataset_meta.json", "labels" or "label_map" and "segmentation_colors" keys are required.')
        return dataset_meta_path

    def get_default_label_data(self) -> Tuple[int, int]:
        return 0, 0


@register_dataset_adapter(TaskEnum.semantic_segmentation, CommonSemanticSegmentationRecognizer)
class CSSSegmentationAdapter(CommonSemanticSegmentationBaseAdapter):
    converter = AnnotationConverterEnum.common_semantic_segmentation.value

    @property
    def masks_dir_name(self) -> Optional[str]:
        for path in self.dataset_path.iterdir():
            if path.is_dir() and path.name.lower() == 'masks':
                return path.name
        raise InconsistentDatasetError('Malformed dataset: no "masks" folder found')

    def get_task_specific_constants(self) -> dict:
        return {
            'masks_dir': self.abs_path(self.masks_dir_name),
            'image_postfix': self.get_extension(str(self.images_dir_name)),
            'mask_postfix': self.get_extension(self.masks_dir_name),
            'dataset_meta_file': self.get_dataset_meta(),
        }

    def to_annotation(self) -> dict:
        result = super().to_annotation()
        result['additional_data_source'] = str(self.abs_path(self.masks_dir_name))
        return result


@register_dataset_adapter(TaskEnum.inpainting, CommonSemanticSegmentationRecognizer)
class CSSInpaintingAdapter(CommonSemanticSegmentationBaseAdapter):
    converter = AnnotationConverterEnum.inpainting.value

    def get_params(self) -> dict:
        params = super().get_params()
        params.pop('dataset_meta_file', None)
        return params

    def get_task_specific_constants(self) -> dict:
        return {}


@register_dataset_adapter(TaskEnum.style_transfer, CommonSemanticSegmentationRecognizer)
class CSSStyleTransferAdapter(CommonSemanticSegmentationBaseAdapter):
    converter = AnnotationConverterEnum.style_transfer.value

    def get_params(self) -> dict:
        params = super().get_params()
        params.pop('dataset_meta_file', None)
        return params

    def get_task_specific_constants(self) -> dict:
        return {}


@register_dataset_adapter(TaskEnum.custom, CommonSemanticSegmentationRecognizer)
class CSSCustomAdapter(CSSSegmentationAdapter):
    converter = AnnotationConverterEnum.custom.value


class CommonSuperResolutionBaseAdapter(BaseImageDatasetAdapter):
    images_dir_name = ''
    lr_directory = 'LR'

    def get_images_dir(self) -> Path:
        """Return absolute path to the directory containing the low-res images."""
        return self.abs_path(self.images_dir_name)

    def get_task_specific_constants(self) -> dict:
        pass

    def get_default_label_data(self) -> Tuple[int, int]:
        return 0, 0


@register_dataset_adapter(TaskEnum.super_resolution, CommonSuperResolutionRecognizer)
class CSRSuperResolutionAdapter(CommonSuperResolutionBaseAdapter):
    converter = AnnotationConverterEnum.super_resolution_dir_based.value
    supported_task_specific_variables = ['two_streams']
    hr_directory = 'HR'
    upsampled_directory = 'upsampled'

    def check_upsample(self) -> bool:
        paths = [item for item in Path(self.dataset_path).iterdir() if item.is_dir()]
        return self.abs_path(self.upsampled_directory) in paths

    def get_task_specific_constants(self) -> dict:
        params = {
            'lr_dir': str(self.abs_path(self.lr_directory)),
            'hr_dir': str(self.abs_path(self.hr_directory)),
            'relaxed_names': True
        }
        if self.check_upsample():
            params['upsampled_dir'] = str(self.abs_path(self.upsampled_directory))
        return params

    def to_annotation(self) -> dict:
        result = super().to_annotation()
        result['additional_data_source'] = str(self.abs_path(self.hr_directory))
        return result


@register_dataset_adapter(TaskEnum.inpainting, CommonSuperResolutionRecognizer)
class CSRInpaintingAdapter(CommonSuperResolutionBaseAdapter):
    images_dir_name = 'HR'
    converter = AnnotationConverterEnum.inpainting.value

    def get_task_specific_constants(self) -> dict:
        return {}


@register_dataset_adapter(TaskEnum.style_transfer, CommonSuperResolutionRecognizer)
class CSRStyleTransferAdapter(CommonSuperResolutionBaseAdapter):
    images_dir_name = 'HR'
    converter = AnnotationConverterEnum.style_transfer.value

    def get_task_specific_constants(self) -> dict:
        return {}


@register_dataset_adapter(TaskEnum.custom, CommonSuperResolutionRecognizer)
class CSRCustomAdapter(CSRSuperResolutionAdapter):
    converter = AnnotationConverterEnum.custom.value


class LabelledFaceAdapter(BaseImageDatasetAdapter):
    def get_specific_params_getters(self):
        raise NotImplementedError

    @property
    def annotation_path(self) -> Path:
        return next(path for path in self.dataset_path.iterdir() if all(obj.is_file() for obj in path.iterdir()))

    def get_images_dir(self) -> Optional[Path]:
        for item in self.dataset_path.iterdir():
            if all(path.is_dir() for path in item.iterdir()):
                return item
        return None

    def get_task_specific_constants(self) -> dict:
        parameters = {}
        specific_params_getters = self.get_specific_params_getters()
        for parameter_name, parameter_value in specific_params_getters.items():
            if not parameter_value:
                continue
            parameters[parameter_name] = parameter_value
        return parameters

    def get_annotation(self, annotation_path: Path, length: int) -> Optional[Path]:
        for file_path in annotation_path.iterdir():
            annotation_checker = self.get_annotation_file_reader(file_path)
            with open(file_path, 'r') as target_file:
                if not annotation_checker(target_file, length):
                    continue
                return file_path
        return None

    @staticmethod
    def csv_annotation_file_check(target_file: TextIO, target_length: int) -> bool:
        return len(target_file.readline().rstrip(',').split(',')) == target_length

    @staticmethod
    def txt_annotation_file_check(target_file: TextIO, target_length: int) -> bool:
        return len(target_file.readline().rstrip().replace('\t', ' ').split(' ')) == target_length

    def get_annotation_file_reader(self, file_path: Path) -> Callable[[TextIO, int], bool]:
        annotation_file_checkers = {
            '.txt': self.txt_annotation_file_check,
            '.csv': self.csv_annotation_file_check,
        }
        return annotation_file_checkers[file_path.suffix]

    def get_default_label_data(self) -> Tuple[int, int]:
        return 0, 0


class LFWBaseAdapter(LabelledFaceAdapter):

    def get_specific_params_getters(self):
        return {
            'pairs_file': self.get_annotation(self.annotation_path, LFW_PAIRS_LENGTH),
            'landmarks_file': self.get_annotation(self.annotation_path, LNDREID_LANDMARK_LENGTH)
        }


@register_dataset_adapter(TaskEnum.face_recognition, LFWRecognizer)
class LFWFaceDetectionAdapter(LFWBaseAdapter):
    converter = AnnotationConverterEnum.lfw.value


@register_dataset_adapter(TaskEnum.custom, LFWRecognizer)
class LFWFaceDetectionCustomAdapter(LFWBaseAdapter):
    converter = AnnotationConverterEnum.custom.value


class VGGFace2BaseAdapter(LabelledFaceAdapter):

    def get_specific_params_getters(self):
        return {
            'landmarks_csv_file': self.get_annotation(self.annotation_path, LNDREID_LANDMARK_LENGTH),
            'bbox_csv_file': self.get_annotation(self.annotation_path, VGGFACE2_BBOX_LENGTH)
        }


@register_dataset_adapter(TaskEnum.landmark_detection, VGGFace2Recognizer)
class VGGFace2LandmarkAdapter(VGGFace2BaseAdapter):
    converter = AnnotationConverterEnum.vgg_face.value


@register_dataset_adapter(TaskEnum.custom, VGGFace2Recognizer)
class VGGFace2LandmarkCustomAdapter(VGGFace2BaseAdapter):
    converter = AnnotationConverterEnum.custom.value


class WiderFaceBaseAdapter(BaseImageDatasetAdapter):

    def get_images_dir(self) -> Optional[Path]:
        dirs = self.dataset_path.glob('**/*')
        for item in dirs:
            if item.is_dir() and item.name == 'images' and all(self.is_event_class_dir(path)
                                                               for path in item.iterdir()):
                return item
        return None

    @staticmethod
    def is_event_class_dir(path: Path) -> bool:
        return path.is_dir() and all(subpath.suffix[1:] in ALLOWED_EXTENSIONS_IMG for subpath in path.iterdir())

    def get_task_specific_constants(self) -> dict:
        raise NotImplementedError

    def get_default_label_data(self) -> Tuple[int, int]:
        # Wider only has 2 classes: 0 for background, 1 for face
        return 2, 1

    def get_annotation(self, length: int) -> Optional[Path]:
        annotation_files = [im_path for im_path in find_all_paths_by_exts(self.dataset_path, ['txt'],
                                                                          recursive=True,
                                                                          result_type=Path)]
        for file_path in annotation_files:
            with file_path.open('r') as target_file:
                if len(target_file.readline().rstrip().replace('\t', ' ').split(' ')) == length:
                    return file_path
        return None

    def get_dataset_meta(self) -> Path:
        annotation_files = [im_path for im_path in find_all_paths_by_exts(self.dataset_path, ['json'], True, Path)]
        for file in annotation_files:
            with file.open('r') as outfile:
                contents = json.load(outfile)
                if 'label_map' in contents:
                    return file

        return self.build_dataset_meta()

    def build_dataset_meta(self) -> Path:
        template = {
            'label_map': {
                '0': '__background__',
                '1': 'face'
            },
            'background_label': 0
        }

        out_path = self.dataset_path / 'dataset_meta.json'
        with out_path.open('w') as outfile:
            json.dump(template, outfile)

        return out_path


@register_dataset_adapter(TaskEnum.object_detection, WiderFaceRecognizer)
class WiderFaceODAdapter(WiderFaceBaseAdapter):
    converter = AnnotationConverterEnum.wider.value

    def get_task_specific_constants(self) -> dict:
        return {
            'annotation_file': self.get_annotation(1)
        }


@register_dataset_adapter(TaskEnum.custom, WiderFaceRecognizer)
class WiderFaceCustomAdapter(WiderFaceBaseAdapter):
    converter = AnnotationConverterEnum.custom.value

    def get_task_specific_constants(self):
        pass


class OpenImagesBaseAdapter(BaseImageDatasetAdapter):
    def get_images_dir(self) -> Path:
        image_paths = [im_path for im_path in find_all_paths_by_exts(self.dataset_path, ALLOWED_EXTENSIONS_IMG,
                                                                     True, Path)]

        return image_paths[0].parent

    def get_task_specific_constants(self) -> dict:
        raise NotImplementedError

    def get_default_label_data(self) -> Tuple[int, int]:
        labels_file = self.get_annotation(2)
        with open(labels_file, 'r') as outfile:
            return sum(1 for _ in outfile), 0

    def get_annotation(self, length: int) -> Optional[Path]:
        annotation_files = [im_path for im_path in find_all_paths_by_exts(self.dataset_path, ['csv'], True, Path)]
        for file_path in annotation_files:
            with open(file_path, 'r') as target_file:
                if len(target_file.readline().rstrip(',').split(',')) == length:
                    return file_path
        return None


@register_dataset_adapter(TaskEnum.object_detection, OpenImagesRecognizer)
class OpenImagesODAdapter(OpenImagesBaseAdapter):
    converter = AnnotationConverterEnum.open_images_detection.value

    def get_task_specific_constants(self) -> dict:
        return {
            'labels_file': self.get_annotation(2),
            'bbox_csv_file': self.get_annotation(13)
        }


@register_dataset_adapter(TaskEnum.custom, OpenImagesRecognizer)
class OpenImagesCustomAdapter(OpenImagesBaseAdapter):
    converter = AnnotationConverterEnum.custom.value

    def get_task_specific_constants(self) -> dict:
        pass


@register_dataset_adapter(None, NotAnnotatedRecognizer)
class NotAnnotatedAdapter:
    converter = AnnotationConverterEnum.image_processing
    supported_task_specific_variables = []

    # pylint: disable=unused-argument
    def __init__(self, dataset_path: str, model_dependent_params: None = None):
        self.dataset_path = Path(dataset_path)
        if not self.dataset_path.exists():
            raise FileNotFoundError(self.dataset_path)
        if not self.dataset_path.is_dir():
            raise NotADirectoryError(self.dataset_path)

        self.images_dir = self.get_images_dir()

    def get_images_dir(self) -> Path:
        image_paths = find_all_paths_by_exts(self.dataset_path, ALLOWED_EXTENSIONS_IMG, True, Path)
        try:
            image_path = next(image_paths)
            return image_path.parent
        except StopIteration:
            raise InconsistentDatasetError(
                'Cannot find any images of supported types: {}.'.format(ALLOWED_EXTENSIONS_IMG))

    def to_annotation(self) -> dict:
        return {
            'data_source': str(self.images_dir),
            'annotation': Annotation(**{
                'converter': self.converter.value,
                'data_dir': str(self.images_dir)
            }),
        }


@register_dataset_adapter(TaskEnum.custom, NotAnnotatedRecognizer)
class NotAnnotatedCustomAdapter(NotAnnotatedAdapter):
    pass


# allow accuracy analysis with parent model on not annotated dataset
@register_dataset_adapter(TaskEnum.classification, NotAnnotatedRecognizer)
class NotAnnotatedClassificationAdapter(NotAnnotatedAdapter):
    pass


@register_dataset_adapter(TaskEnum.object_detection, NotAnnotatedRecognizer)
class NotAnnotatedODAdapter(NotAnnotatedAdapter):
    pass


@register_dataset_adapter(TaskEnum.instance_segmentation, NotAnnotatedRecognizer)
class NotAnnotatedISAdapter(NotAnnotatedAdapter):
    pass


@register_dataset_adapter(TaskEnum.semantic_segmentation, NotAnnotatedRecognizer)
class NotAnnotatedSSAdapter(NotAnnotatedAdapter):
    pass


@register_dataset_adapter(TaskEnum.semantic_segmentation, NotAnnotatedRecognizer)
class NotAnnotatedSSAdapter(NotAnnotatedAdapter):
    pass


class BaseTextDatasetAdapter:
    _task_type: TaskEnum
    task_type_to_adapter: Dict[TaskEnum, Type['BaseTextDatasetAdapter']] = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        cls.task_type_to_adapter[cls._task_type] = cls

    @classmethod
    def from_model(cls, dataset_model: 'DatasetsModel', **kwargs) -> 'BaseTextDatasetAdapter':
        task_type = next(iter(dataset_model.task_types)).task_type
        adapter = cls.task_type_to_adapter[task_type]
        return adapter(**adapter.get_init_kwargs(dataset_model), **kwargs)

    @staticmethod
    def get_init_kwargs(dataset_model: 'DatasetsModel') -> Dict[str, Any]:
        raise NotImplementedError

    @classmethod
    def get_dataset_job_data(cls, request: Dict[str, Any]):
        try:
            task_type = TaskEnum(request['taskType'])
            adapter = cls.task_type_to_adapter[task_type]
        except (ValueError, KeyError):
            raise Exception('Unsupported task type!')
        return adapter.get_task_specific_data(request)

    @classmethod
    def get_task_specific_data(cls, request: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    def __iter__(self):
        raise NotImplementedError

    def feature_iter(self) -> Iterator:
        """Return data without label"""
        raise NotImplementedError


class BaseCSVDatasetAdapter(BaseTextDatasetAdapter):
    _task_type = None
    _column_order: List[str]

    def __init__(self, file_path: Union[str, Path], number_of_rows: Optional[int] = None):
        self.dataset: DataFrame = pandas.read_csv(
            file_path,
            names=self._column_order,
            index_col=False,
            nrows=number_of_rows,
        )

    def __len__(self):
        return len(self.dataset)

    def __iter__(self):
        return self.dataset.itertuples(index=False, name="CSVDatasetRow")

    @staticmethod
    def get_init_kwargs(dataset_model: 'DatasetsModel') -> Dict[str, Any]:
        return dict(file_path=next(Path(dataset_model.path).iterdir()))

    def feature_iter(self) -> Generator[List[str], None, None]:
        """Return data without label column"""
        yield from (list(row[:-1]) if len(row) > 2 else row[0] for row in self)

    @classmethod
    def get_task_specific_data(cls, request: Dict[str, Any]) -> Dict[str, Any]:
        return dict(
            columns=[request['columns'][column_name] for column_name in cls._column_order],
            header=request['header'],
            encoding=request['encoding'],
            separator=CSVDatasetSeparatorEnum(request['separator']),
            task_type=cls._task_type,
        )


class CSVTextClassificationDatasetAdapter(BaseCSVDatasetAdapter):
    _column_order = ['text', 'label']
    _task_type = TaskEnum.text_classification


class CSVTextualEntailmentDatasetAdapter(BaseCSVDatasetAdapter):
    _column_order = ['premise', 'hypothesis', 'label']
    _task_type = TaskEnum.textual_entailment
