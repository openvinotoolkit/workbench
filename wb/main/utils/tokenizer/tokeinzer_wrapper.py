"""
 OpenVINO DL Workbench
 Class that wraps tokenization logic

 Copyright (c) 2021 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
from pathlib import Path
from typing import Union, List, Dict, Any, Optional

from transformers import AutoTokenizer, PreTrainedTokenizerBase, BatchEncoding

from wb.main.enumerates import TokenizerTypeEnum
from wb.main.models import TokenizerModel


class TokenizerWrapper:
    tokenizer_types_map = {
        TokenizerTypeEnum.wordpiece: 'bert',
        TokenizerTypeEnum.BPE: 'roberta',
    }

    tokenizer_files_map = {
        TokenizerTypeEnum.wordpiece: {'vocabFile': 'vocab.txt'},
        TokenizerTypeEnum.BPE: {'vocabFile': 'vocab.json', 'mergesFile': 'merges.txt'},
    }

    def __init__(self, tokenizer_folder: Path, tokenizer_type: Optional[TokenizerTypeEnum] = None):
        self._tokenizer: PreTrainedTokenizerBase = AutoTokenizer.from_pretrained(
            tokenizer_folder,
            tokenizer_type=self.tokenizer_types_map.get(tokenizer_type)
        )

    @classmethod
    def from_model(cls, tokenizer_model: TokenizerModel) -> "TokenizerWrapper":
        return cls(
            tokenizer_folder=Path(tokenizer_model.path),
            tokenizer_type=tokenizer_model.tokenizer_type,
        )

    @staticmethod
    def tokenizer_kwargs_from_model_shape(model_shape: Dict[str, List[int]]) -> Dict[str, Any]:
        return {
            'max_length': next(iter(model_shape.values()))[1],  # Layout is NC - (batch_size, sequence_length)
            'truncation': True,
            'return_token_type_ids': len(model_shape) == 3,
            'padding': 'max_length',
        }

    def __call__(self, texts: Union[List[str], List[List[str]]], *args, **kwargs) -> BatchEncoding:
        return self._tokenizer(texts, *args, **kwargs, return_tensors='np')

    def vocab_size(self) -> int:
        return self._tokenizer.vocab_size

    def validate(self) -> None:
        self._tokenizer('test_text')

    def save(self, path: Union[str, Path]) -> None:
        self._tokenizer.save_pretrained(path)
