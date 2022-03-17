"""
 OpenVINO DL Workbench
 Classes for Jupyter notebook cell template contexts

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
