"""
 OpenVINO DL Workbench
 Cell related classes for generated Jupyter notebook

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
import enum
from typing import Type

from wb.main.jupyter_notebooks.config_file_dumpers import BaseConfigFileDumper, AccuracyConfigFileDumper, \
    Int8OptimizationConfigFileDumper


class NotebookCellTypes(enum.Enum):
    markdown = 'markdown'
    code = 'code'


class NotebookCellIds(enum.Enum):
    intro_docs = 'intro_docs'
    obtain_model_docs = 'obtain_model_docs'
    obtain_model_result_docs = 'obtain_model_result_docs'
    model_downloader_docs = 'model_downloader_docs'
    get_omz_models_docs = 'get_omz_models_docs'
    get_omz_models_code = 'get_omz_models_code'
    downloader_model_exists_docs = 'downloader_model_exists_docs'
    model_downloader_code = 'model_downloader_code'
    model_downloader_result_docs = 'model_downloader_result_docs'
    model_converter_docs = 'model_converter_docs'
    model_converter_code = 'model_converter_code'
    model_converter_result_docs = 'model_converter_result_docs'
    model_optimizer_docs = 'model_optimizer_docs'
    model_optimizer_code = 'model_optimizer_code'
    model_optimizer_result_docs = 'model_optimizer_result_docs'
    set_original_ir_model_paths_docs = 'set_original_ir_model_paths_docs'
    set_original_ir_model_paths_code = 'set_original_ir_model_paths_code'
    validate_ir_model_docs = 'validate_ir_model_docs'
    validate_ir_model_code = 'validate_ir_model_code'
    profiling_docs = 'profiling_docs'
    profiling_code = 'profiling_code'
    accuracy_docs = 'accuracy_docs'
    check_accuracy_config_code = 'check_accuracy_config_code'
    accuracy_code = 'accuracy_code'
    int8_optimization_docs = 'int8_optimization_docs'
    check_int8_optimization_config_code = 'check_int8_optimization_config_code'
    int8_model_exists_docs = 'int8_model_exists_docs'
    int8_optimization_code = 'int8_optimization_code'
    int8_optimization_result_docs = 'int8_optimization_result_docs'
    set_optimized_ir_model_paths_docs = 'set_optimized_ir_model_paths_docs'
    set_optimized_ir_model_paths_code = 'set_optimized_ir_model_paths_code'
    summary_docs = 'summary_docs'
    install_python_requirements_code = 'install_python_requirements_code'
    install_python_requirements_docs = 'install_python_requirements_docs'
    load_tokenizer_docs = 'load_tokenizer_docs'
    load_tokenizer_code = 'load_tokenizer_code'
    tokenize_dataset_docs = 'tokenize_dataset_docs'
    tokenize_dataset_code = 'tokenize_dataset_code'
    tokenizer_parameters_code = 'tokenizer_parameters_code'


class NotebookCellConfig:
    def __init__(self, cell_id: NotebookCellIds, cell_type: NotebookCellTypes, template_filename: str,
                 config_dumper_class: Type[BaseConfigFileDumper] = None):
        self.cell_id = cell_id
        self.cell_type = cell_type
        self.template_filename = template_filename
        self.config_dumper_class = config_dumper_class

    @property
    def cell_metadata(self) -> dict:
        return {
            'cell_id': self.cell_id.value,
        }


class NotebookCells:
    intro_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.intro_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='intro_docs_cell.jinja')

    obtain_model_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.obtain_model_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='obtain_model_docs_cell.jinja')

    obtain_model_result_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.obtain_model_result_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='obtain_model_result_docs_cell.jinja')

    model_downloader_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.model_downloader_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='model_downloader_docs_cell.jinja')

    get_omz_models_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.get_omz_models_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='get_omz_models_docs_cell.jinja')

    get_omz_models_code = NotebookCellConfig(
        cell_id=NotebookCellIds.get_omz_models_code,
        cell_type=NotebookCellTypes.code,
        template_filename='get_omz_models_code_cell.jinja')

    downloader_model_exists_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.downloader_model_exists_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='downloader_model_exists_docs_cell.jinja')

    model_downloader_code = NotebookCellConfig(
        cell_id=NotebookCellIds.model_downloader_code,
        cell_type=NotebookCellTypes.code,
        template_filename='model_downloader_code_cell.jinja')

    model_downloader_result_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.model_downloader_result_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='model_downloader_result_docs_cell.jinja')

    model_converter_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.model_converter_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='model_converter_docs_cell.jinja')

    model_converter_code = NotebookCellConfig(
        cell_id=NotebookCellIds.model_converter_code,
        cell_type=NotebookCellTypes.code,
        template_filename='model_converter_code_cell.jinja')

    model_converter_result_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.model_converter_result_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='model_converter_result_docs_cell.jinja')

    model_optimizer_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.model_optimizer_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='model_optimizer_docs_cell.jinja')

    model_optimizer_code = NotebookCellConfig(
        cell_id=NotebookCellIds.model_optimizer_code,
        cell_type=NotebookCellTypes.code,
        template_filename='model_optimizer_code_cell.jinja')

    model_optimizer_result_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.model_optimizer_result_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='model_optimizer_result_docs_cell.jinja')

    set_original_ir_model_paths_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.set_original_ir_model_paths_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='set_ir_model_paths_docs_cell.jinja')

    set_original_ir_model_paths_code = NotebookCellConfig(
        cell_id=NotebookCellIds.set_original_ir_model_paths_code,
        cell_type=NotebookCellTypes.code,
        template_filename='set_ir_model_paths_code_cell.jinja')

    validate_ir_model_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.validate_ir_model_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='validate_ir_model_docs_cell.jinja')

    validate_ir_model_code = NotebookCellConfig(
        cell_id=NotebookCellIds.validate_ir_model_code,
        cell_type=NotebookCellTypes.code,
        template_filename='validate_ir_model_code_cell.jinja')

    tokenizer_parameters_code_code = NotebookCellConfig(
        cell_id=NotebookCellIds.tokenizer_parameters_code,
        cell_type=NotebookCellTypes.code,
        template_filename='tokenizer_parameters_code_cell.jinja')

    load_tokenizer_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.load_tokenizer_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='load_tokenizer_docs_cell.jinja')

    load_tokenizer_code = NotebookCellConfig(
        cell_id=NotebookCellIds.load_tokenizer_code,
        cell_type=NotebookCellTypes.code,
        template_filename='load_tokenizer_code_cell.jinja')

    tokenize_dataset_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.tokenize_dataset_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='tokenize_dataset_docs_cell.jinja')

    tokenize_dataset_code = NotebookCellConfig(
        cell_id=NotebookCellIds.tokenize_dataset_code,
        cell_type=NotebookCellTypes.code,
        template_filename='tokenize_dataset_code_cell.jinja')

    profiling_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.profiling_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='profiling_docs_cell.jinja')

    profiling_code = NotebookCellConfig(
        cell_id=NotebookCellIds.profiling_code,
        cell_type=NotebookCellTypes.code,
        template_filename='profiling_code_cell.jinja')

    accuracy_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.accuracy_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='accuracy_docs_cell.jinja')

    install_python_requirements_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.install_python_requirements_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='install_python_requirements_docs_cell.jinja')

    install_python_requirements_code = NotebookCellConfig(
        cell_id=NotebookCellIds.install_python_requirements_code,
        cell_type=NotebookCellTypes.code,
        template_filename='install_python_requirements_code_cell.jinja')

    check_accuracy_config_code = NotebookCellConfig(
        cell_id=NotebookCellIds.check_accuracy_config_code,
        cell_type=NotebookCellTypes.code,
        template_filename='check_accuracy_config_code_cell.jinja')

    accuracy_code = NotebookCellConfig(
        cell_id=NotebookCellIds.accuracy_code,
        cell_type=NotebookCellTypes.code,
        template_filename='accuracy_code_cell.jinja',
        config_dumper_class=AccuracyConfigFileDumper)

    int8_optimization_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.int8_optimization_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='int8_optimization_docs_cell.jinja')

    check_int8_optimization_config_code = NotebookCellConfig(
        cell_id=NotebookCellIds.check_int8_optimization_config_code,
        cell_type=NotebookCellTypes.code,
        template_filename='check_int8_optimization_config_code_cell.jinja')

    int8_model_exists_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.int8_model_exists_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='int8_model_exists_docs_cell.jinja')

    int8_optimization_code = NotebookCellConfig(
        cell_id=NotebookCellIds.int8_optimization_code,
        cell_type=NotebookCellTypes.code,
        template_filename='int8_optimization_code_cell.jinja',
        config_dumper_class=Int8OptimizationConfigFileDumper)

    int8_optimization_result_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.int8_optimization_result_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='int8_optimization_result_docs_cell.jinja')

    set_optimized_ir_model_paths_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.set_optimized_ir_model_paths_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='set_ir_model_paths_docs_cell.jinja')

    set_optimized_ir_model_paths_code = NotebookCellConfig(
        cell_id=NotebookCellIds.set_optimized_ir_model_paths_code,
        cell_type=NotebookCellTypes.code,
        template_filename='set_ir_model_paths_code_cell.jinja')

    summary_docs = NotebookCellConfig(
        cell_id=NotebookCellIds.summary_docs,
        cell_type=NotebookCellTypes.markdown,
        template_filename='summary_docs_cell.jinja')
