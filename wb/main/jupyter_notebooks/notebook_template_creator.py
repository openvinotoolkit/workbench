"""
 OpenVINO DL Workbench
 Class for creating templates for Jupyter notebooks generation

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
from typing import List, Optional

from typing_extensions import TypedDict

from wb.main.enumerates import OptimizationTypesEnum, SupportedFrameworksEnum, ModelSourceEnum
from wb.main.jupyter_notebooks.jupyter_notebook_cell import NotebookCellConfig, NotebookCells


class NotebookSectionCells(TypedDict):
    check_model_format: List[NotebookCellConfig]
    check_optimized_model_format: List[NotebookCellConfig]
    profiling: List[NotebookCellConfig]
    accuracy: List[NotebookCellConfig]
    model_tokenizer: Optional[List[NotebookCellConfig]]


class NotebookTemplateCreator:
    _notebook_section_cells = NotebookSectionCells(
        check_model_format=[
            NotebookCells.set_original_ir_model_paths_docs,
            NotebookCells.set_original_ir_model_paths_code,
            NotebookCells.validate_ir_model_docs,
            NotebookCells.install_python_requirements_docs,
            NotebookCells.install_python_requirements_code,
            NotebookCells.validate_ir_model_code,
        ],
        check_optimized_model_format=[
            NotebookCells.set_optimized_ir_model_paths_docs,
            NotebookCells.set_optimized_ir_model_paths_code,
            NotebookCells.validate_ir_model_docs,
            NotebookCells.validate_ir_model_code,
        ],
        model_tokenizer=[
            NotebookCells.load_tokenizer_docs,
            NotebookCells.tokenizer_parameters_code,
            NotebookCells.load_tokenizer_code,
            NotebookCells.tokenize_dataset_docs,
            NotebookCells.tokenize_dataset_code,
        ],
        profiling=[
            NotebookCells.profiling_docs,
            NotebookCells.profiling_code,
        ],
        accuracy=[
            NotebookCells.accuracy_docs,
            NotebookCells.check_accuracy_config_code,
            NotebookCells.accuracy_code,
        ],
    )

    def __init__(
        self,
        notebook_type: OptimizationTypesEnum,
        original_model_source: ModelSourceEnum,
        original_model_framework: SupportedFrameworksEnum,
        is_nlp: bool = False,
        has_tokenizer: bool = False,
    ):
        self._notebook_type = notebook_type
        self._original_model_source = original_model_source
        self._original_model_framework = original_model_framework
        self.is_nlp = is_nlp
        self._has_tokenizer = has_tokenizer

    @property
    def _obtain_model_section_cells(self) -> List[NotebookCellConfig]:
        if self._original_model_source == ModelSourceEnum.omz:
            obtain_model_cells = [
                NotebookCells.obtain_model_docs,
                NotebookCells.model_downloader_docs,
                NotebookCells.get_omz_models_docs,
                NotebookCells.get_omz_models_code,
                NotebookCells.downloader_model_exists_docs,
                NotebookCells.model_downloader_code,
                NotebookCells.model_downloader_result_docs,
            ]
            if self._original_model_framework != SupportedFrameworksEnum.openvino:
                obtain_model_cells.extend([
                    NotebookCells.model_converter_docs,
                    NotebookCells.model_converter_code,
                    NotebookCells.model_converter_result_docs,
                ])
            obtain_model_cells.append(NotebookCells.obtain_model_result_docs)
            return obtain_model_cells
        if self._original_model_source == ModelSourceEnum.huggingface:
            return [
                NotebookCells.obtain_model_docs,
                NotebookCells.transformers_onnx_converter_docs,
                NotebookCells.transformers_onnx_converter_code,
                NotebookCells.transformers_onnx_converter_result_docs,
                NotebookCells.model_optimizer_docs,
                NotebookCells.model_optimizer_code,
                NotebookCells.model_optimizer_result_docs,
                NotebookCells.obtain_model_result_docs,
            ]
        if self._original_model_source == ModelSourceEnum.original:
            return [
                NotebookCells.obtain_model_docs,
                NotebookCells.model_optimizer_docs,
                NotebookCells.model_optimizer_code,
                NotebookCells.model_optimizer_result_docs,
                NotebookCells.obtain_model_result_docs,
            ]
        return [
            NotebookCells.obtain_model_docs,
            NotebookCells.obtain_model_result_docs,
        ]

    @property
    def _int8_section_cells(self) -> List[NotebookCellConfig]:
        if self._notebook_type == OptimizationTypesEnum.int8calibration:
            return [
                NotebookCells.int8_optimization_docs,
                NotebookCells.check_int8_optimization_config_code,
                NotebookCells.int8_model_exists_docs,
                NotebookCells.int8_optimization_code,
                NotebookCells.int8_optimization_result_docs,
            ]
        return [
            NotebookCells.int8_optimization_docs,
            NotebookCells.check_int8_optimization_config_code,
            NotebookCells.int8_optimization_code,
            NotebookCells.int8_optimization_result_docs,
        ]

    def create(self) -> List[NotebookCellConfig]:
        if self.is_nlp:
            return [
                NotebookCells.intro_docs,
                *self._obtain_model_section_cells,
                *self._notebook_section_cells['check_model_format'],
                *(self._notebook_section_cells['model_tokenizer'] if self._has_tokenizer else []),
                *self._notebook_section_cells['profiling'],
                NotebookCells.summary_docs,
            ]
        if self._notebook_type == OptimizationTypesEnum.int8calibration:
            return [
                NotebookCells.intro_docs,
                *self._obtain_model_section_cells,
                *self._notebook_section_cells['check_model_format'],
                *self._int8_section_cells,
                *NotebookTemplateCreator._notebook_section_cells['check_optimized_model_format'],
                *self._notebook_section_cells['profiling'],
                *self._notebook_section_cells['accuracy'],
                NotebookCells.summary_docs,
            ]
        return [
            NotebookCells.intro_docs,
            *self._obtain_model_section_cells,
            *self._notebook_section_cells['check_model_format'],
            *self._notebook_section_cells['profiling'],
            *self._notebook_section_cells['accuracy'],
            *self._int8_section_cells,
            NotebookCells.summary_docs,
        ]
