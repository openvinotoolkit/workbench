"""
 OpenVINO DL Workbench
 Validate model from Hugging Face Hub

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
from typing import List, Set, Optional

from huggingface_hub.hf_api import ModelInfo
from transformers.onnx import FeaturesManager

from wb.error.job_error import TransformersONNXConversionError


class ValidationResult:
    def __init__(self, disabled: bool, message: Optional[str] = None):
        self.disabled = disabled
        self.message = message

    def json(self) -> dict:
        result = {'disabled': self.disabled}
        if self.message:
            result['message'] = self.message
        return result


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


def validate_hf_model(model: ModelInfo) -> ValidationResult:
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
