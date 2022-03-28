"""
 OpenVINO DL Workbench
 Endpoints to work with hf

 Copyright (c) 2022 Intel Corporation

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
import importlib
from collections import Counter
from pathlib import Path
from typing import List, Optional, Set

from huggingface_hub import HfApi, hf_hub_url
from huggingface_hub.file_download import cached_download
from huggingface_hub.hf_api import ModelInfo
from transformers.onnx import FeaturesManager

from wb.error.job_error import TransformersONNXConversionError

_huggingface_api = HfApi()


class HuggingfaceModelConfig:
    def __init__(
            self,
            architectures: Optional[List[str]] = None,
            model_type: Optional[str] = None,
            **kwargs,
    ):
        self.architectures = architectures
        self.model_type = model_type

    def json(self):
        return {
            'architectures': self.architectures,
            'modelType': self.model_type,
        }


class ValidationResult:
    def __init__(self, disabled: bool, message: Optional[str] = None):
        self.disabled = disabled
        self.message = message

    def json(self) -> dict:
        result = {'disabled': self.disabled}
        if self.message:
            result['message'] = self.message
        return result


class HuggingfaceModel:
    def __init__(
            self,
            model_id: str,
            pipeline_tag: str,
            last_modified: str,
            tags: List[str],
            validation: ValidationResult,
            siblings: Optional[List[str]] = None,
            config: Optional[dict] = None,
            downloads: Optional[int] = None,
    ):
        self.model_id = model_id
        self.pipeline_tag = pipeline_tag
        self.last_modified = last_modified
        self.tags = tags
        self.validation = validation
        self.siblings = siblings
        self.config = HuggingfaceModelConfig(**config) if config else None
        self.downloads = downloads

    def json(self):
        return {
            'id': self.model_id,
            'pipelineTag': self.pipeline_tag,
            'lastModified': self.last_modified,
            'tags': self.tags,
            'validation': self.validation.json(),
            'siblings': self.siblings,
            'config': self.config.json() if self.config else None,
            'downloads': self.downloads,
        }


supports_classification = {
    model_type for model_type, tasks in FeaturesManager._SUPPORTED_MODEL_TYPE.items()
    if 'sequence-classification' in tasks
}

contains_decoder = {
    model_type for model_type, tasks in FeaturesManager._SUPPORTED_MODEL_TYPE.items()
    if any('with-past' in task for task in tasks)
}


def get_vocab_filenames(model_type: str) -> List[Set[str]]:
    files = []
    for tokenizer_type in ('', '_fast'):
        try:
            module = importlib.import_module(
                f'.tokenization_{model_type}{tokenizer_type}', f'transformers.models.{model_type}'
            )
        except ModuleNotFoundError:
            continue
        vocab_dict = getattr(module, 'VOCAB_FILES_NAMES')
        if vocab_dict:
            files.append(set(vocab_dict.values()))
    return files


supported_models = supports_classification.difference(contains_decoder)

tokenizer_vocab_files = {
    model_type: get_vocab_filenames(model_type) for model_type in supported_models
}


def has_missing_tokenizer_files(model: ModelInfo) -> bool:
    repo_files = {file.rfilename for file in model.siblings}
    tokenizers_files = tokenizer_vocab_files[model.config['model_type']]
    return all(tokenizer_files - repo_files for tokenizer_files in tokenizers_files)


def _validate_hf_model(model: ModelInfo) -> ValidationResult:
    if not model.config:
        return ValidationResult(disabled=True, message=TransformersONNXConversionError.get_no_config_message())
    if 'model_type' not in model.config:
        return ValidationResult(disabled=True, message=TransformersONNXConversionError.get_no_model_type_message())
    model_type = model.config['model_type']
    if model_type not in FeaturesManager._SUPPORTED_MODEL_TYPE:
        return ValidationResult(
            disabled=True, message=TransformersONNXConversionError.get_not_supported_model_type_message(model_type)
        )
    if model_type not in supports_classification:
        return ValidationResult(
            disabled=True,
            message=TransformersONNXConversionError.get_not_supported_sequence_classification_message(model_type)
        )
    if model_type in contains_decoder:
        return ValidationResult(
            disabled=True,
            message=TransformersONNXConversionError.get_decoder_not_supported_message(model_type)
        )
    if has_missing_tokenizer_files(model):
        return ValidationResult(
            disabled=True,
            message=TransformersONNXConversionError.get_has_missing_tokenizer_files_message()
        )
    return ValidationResult(disabled=False)


def _convert_hf_model_info(model_info: ModelInfo) -> HuggingfaceModel:
    return HuggingfaceModel(
        model_id=model_info.modelId,
        pipeline_tag=model_info.pipeline_tag,
        last_modified=model_info.lastModified,
        tags=model_info.tags,
        validation=_validate_hf_model(model_info),
        siblings=[x.rfilename for x in model_info.siblings],
        config=model_info.config,
        downloads=getattr(model_info, 'downloads', None),
    )


def get_model_type_filter_options(models: List[HuggingfaceModel]) -> List[str]:
    counter = Counter()
    for model in models:
        if not model.config or not model.config.model_type:
            continue
        counter[model.config.model_type] += 1
    return [model_type for model_type, _ in counter.most_common()]


# todo: 81020, parallel models and tags requests once mechanism implemented
def get_models() -> dict:
    pipeline_tag = 'text-classification'
    applied_tags = {
        'pipelineTags': [pipeline_tag],
        'libraries': ['pytorch', 'transformers'],
    }
    models = _huggingface_api.list_models(
        filter=[tags for tags_list in applied_tags.values() for tags in tags_list],
        sort='downloads',
        direction=-1,
        fetch_config=True
    )
    models = [_convert_hf_model_info(model) for model in models if model.pipeline_tag == pipeline_tag]
    return {
        'models': [model.json() for model in models],
        'tags': {
            'applied': applied_tags,
            'available': {
                'modelTypes': get_model_type_filter_options(models)
            }
        },
    }


def get_tags() -> dict:
    tags = _huggingface_api.get_model_tags()
    return {
        'languages': list(tags.language.values()),
        'licenses': list(tags.license.values()),
    }


def get_model_details(model_id: str) -> Path:
    hf_readme_url = hf_hub_url(repo_id=model_id, filename="README.md")
    readme_path = Path(cached_download(hf_readme_url))
    return readme_path
