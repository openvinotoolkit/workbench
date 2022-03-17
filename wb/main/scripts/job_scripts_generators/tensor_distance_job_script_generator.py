"""
 OpenVINO DL Workbench
 Class to generate job.sh script content for tensor distance job

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
import os
from typing import Optional, NamedTuple

from config.constants import JOBS_SCRIPTS_FOLDER_NAME, ACCURACY_ARTIFACTS_FOLDER, JOBS_SCRIPTS_FOLDER, \
    JOB_ARTIFACTS_FOLDER_NAME
from wb.main.enumerates import TargetTypeEnum, JobTypesEnum
from wb.main.models import PerTensorReportJobsModel, TargetModel, ProjectsModel, TopologiesModel
from wb.main.scripts.job_scripts_generators.job_script_generator import JobScriptGenerator, JobScriptGenerationContext


class TensorDistanceJobScriptContext(JobScriptGenerationContext):
    TENSOR_DISTANCE_WRAPPER_PATH_IN_BUNDLE: str
    ORIGINAL_MODEL_XML_PATH_IN_BUNDLE: str
    # TODO Consider model bin files to be in the same directory - remove them from context
    ORIGINAL_MODEL_BIN_PATH_IN_BUNDLE: str
    INT8_MODEL_XML_PATH_IN_BUNDLE: str
    INT8_MODEL_BIN_PATH_IN_BUNDLE: str
    DATASET_PATH_IN_BUNDLE: str
    OUTPUT_REPORT_PATH_IN_BUNDLE: Optional[str]


class TensorDistanceJobScriptGenerator(JobScriptGenerator):
    wrapper_script_filename = 'calculate_tensor_distance.py'
    # TODO Move bundle-related paths to remote job context constructor
    _wrapper_script_relative_path = os.path.join(JOBS_SCRIPTS_FOLDER_NAME, wrapper_script_filename)

    _script_context = TensorDistanceJobScriptContext(
        **JobScriptGenerator._script_context,
        job_type=JobTypesEnum.per_tensor_report_type.value,
    )


class TensorDistanceJobScriptModelPaths(NamedTuple):
    original_model_xml_path: str
    original_model_bin_path: str
    int8_model_xml_path: str
    int8_model_bin_path: str


class LocalTensorDistanceJobScriptGenerator(TensorDistanceJobScriptGenerator):
    _script_context = TensorDistanceJobScriptContext(
        **TensorDistanceJobScriptGenerator._script_context,
        TENSOR_DISTANCE_WRAPPER_PATH_IN_BUNDLE=os.path.join(
            JOBS_SCRIPTS_FOLDER, TensorDistanceJobScriptGenerator.wrapper_script_filename
        ),
    )

    def __init__(self, models_paths: TensorDistanceJobScriptModelPaths, dataset_path: str, pipeline_id: int):
        super().__init__()
        self._script_context.update({
            'ORIGINAL_MODEL_XML_PATH_IN_BUNDLE': models_paths.original_model_xml_path,
            'ORIGINAL_MODEL_BIN_PATH_IN_BUNDLE': models_paths.original_model_bin_path,
            'INT8_MODEL_XML_PATH_IN_BUNDLE': models_paths.int8_model_xml_path,
            'INT8_MODEL_BIN_PATH_IN_BUNDLE': models_paths.int8_model_bin_path,
            'DATASET_PATH_IN_BUNDLE': dataset_path,
            'OUTPUT_REPORT_PATH_IN_BUNDLE': os.path.join(
                ACCURACY_ARTIFACTS_FOLDER,
                str(pipeline_id),
                JOB_ARTIFACTS_FOLDER_NAME
            ),
        })


class RemoteTensorDistanceJobScriptGenerator(TensorDistanceJobScriptGenerator):
    _remote_path_prefix = '$JOB_BUNDLE_PATH'
    _models_path_in_bundle = f'{_remote_path_prefix}/models'
    _parent_model_path_in_bundle = os.path.join(_models_path_in_bundle, 'parent')
    _optimized_model_path_in_bundle = os.path.join(_models_path_in_bundle, 'optimized')
    _dataset_path_in_bundle = 'dataset'

    _script_context = TensorDistanceJobScriptContext(
        **TensorDistanceJobScriptGenerator._script_context,
        DATASET_PATH_IN_BUNDLE=f'{_remote_path_prefix}/{_dataset_path_in_bundle}',
        OUTPUT_REPORT_PATH_IN_BUNDLE='${ARTIFACTS_PATH}',
        TENSOR_DISTANCE_WRAPPER_PATH_IN_BUNDLE=os.path.join(
            f'$JOB_BUNDLE_PATH/{os.path.join(JOBS_SCRIPTS_FOLDER_NAME, TensorDistanceJobScriptGenerator.wrapper_script_filename)}',
        )
    )

    def __init__(self, models_paths: TensorDistanceJobScriptModelPaths):
        super().__init__()
        original_model_xml_filename, original_model_bin_filename, int8_model_xml_filename, int8_model_bin_filename = (
            os.path.basename(path) for path in models_paths
        )
        self._script_context.update({
            'ORIGINAL_MODEL_XML_PATH_IN_BUNDLE': os.path.join(
                self._parent_model_path_in_bundle,
                original_model_xml_filename
            ),
            'ORIGINAL_MODEL_BIN_PATH_IN_BUNDLE': os.path.join(
                self._parent_model_path_in_bundle,
                original_model_bin_filename
            ),
            'INT8_MODEL_XML_PATH_IN_BUNDLE': os.path.join(
                self._optimized_model_path_in_bundle,
                int8_model_xml_filename
            ),
            'INT8_MODEL_BIN_PATH_IN_BUNDLE': os.path.join(
                self._optimized_model_path_in_bundle,
                int8_model_bin_filename
            ),
        })


def get_tensor_distance_job_script_generator(
        per_tensor_report_job_model: PerTensorReportJobsModel) -> TensorDistanceJobScriptGenerator:
    target: TargetModel = per_tensor_report_job_model.project.target
    project: ProjectsModel = per_tensor_report_job_model.project
    int8_topology: TopologiesModel = project.topology
    parent_topology = int8_topology.optimized_from_record
    original_model_xml, original_model_bin = parent_topology.files_paths
    int8_model_xml, int8_model_bin = int8_topology.files_paths
    pipeline_id = per_tensor_report_job_model.pipeline_id
    models_paths = TensorDistanceJobScriptModelPaths(original_model_xml_path=original_model_xml,
                                                     original_model_bin_path=original_model_bin,
                                                     int8_model_xml_path=int8_model_xml,
                                                     int8_model_bin_path=int8_model_bin)
    if target.target_type == TargetTypeEnum.local:
        dataset_path = project.dataset.dataset_data_dir

        return LocalTensorDistanceJobScriptGenerator(models_paths=models_paths,
                                                     dataset_path=dataset_path,
                                                     pipeline_id=pipeline_id)

    else:
        return RemoteTensorDistanceJobScriptGenerator(models_paths=models_paths)
