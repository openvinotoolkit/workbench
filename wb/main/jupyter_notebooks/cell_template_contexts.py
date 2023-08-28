"""
 OpenVINO DL Workbench
 Classes for Jupyter notebook cell template contexts

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

from typing import Optional

try:
    from typing import TypedDict
except ImportError:
    from typing_extensions import TypedDict


class IntroCellTemplateContext(TypedDict):
    is_optimized_project: bool
    project_model_name: str
    project_model_domain: str
    project_device_name: str
    project_model_task_type: str
    project_model_framework: str
    project_model_precisions: str
    project_model_source: str
    has_tokenizer_section: bool
    has_accuracy_checker_section: bool
    has_int8_calibration_section: bool


class PythonToolCodeCellTemplateContext(TypedDict):
    python_executor: str


class ObtainModelDocsCellTemplateContext(TypedDict):
    project_model_name: str
    project_model_source: str
    project_model_framework: str


class ModelDownloaderCodeCellTemplateContext(TypedDict):
    omz_model_name: str
    output_directory_path: str


class ModelConverterCodeCellTemplateContext(ModelDownloaderCodeCellTemplateContext):
    download_directory_path: str


class ModelOptimizerCodeCellTemplateContext(PythonToolCodeCellTemplateContext):
    mo_arguments: str
    output_directory_path: str


class CheckModelFormatDocsCellTemplateContext(TypedDict):
    is_optimized_project: bool


class SetIRModelPathsCodeCellTemplateContext(TypedDict):
    model_xml_file_path: str
    model_bin_file_path: str


class ProfilingCodeCellTemplateContext(PythonToolCodeCellTemplateContext):
    model_xml_path: str
    image_path: str
    device: str
    batch: int
    streams: int
    inference_time: int
    has_tokenizer_section: bool


class ProfilingDocsCellTemplateContext(PythonToolCodeCellTemplateContext):
    is_nlp: bool


class TokenizerParametersTemplateContext(TypedDict):
    tokenizer_path: Optional[str]
    dataset_path: str
    batch: Optional[int]
    streams: Optional[int]


class AccuracyDocsCellTemplateContext(TypedDict):
    yaml_config_path: str


class AccuracyCodeCellTemplateContext(AccuracyDocsCellTemplateContext):
    json_config: str
    model_directory_path: str
    images_directory_path: str


class Int8OptimizationDocsCellTemplateContext(TypedDict):
    is_optimized_project: bool
    int8_optimization_config_path: str


class Int8OptimizationCodeCellTemplateContext(Int8OptimizationDocsCellTemplateContext):
    int8_optimization_config: str
    output_directory_path: str


class InstallRequirementsCodeCellTemplateContext(TypedDict):
    requirements_file: str


class TransformersONNXCodeCellTemplateContext(TypedDict):
    model_checkpoint: str
