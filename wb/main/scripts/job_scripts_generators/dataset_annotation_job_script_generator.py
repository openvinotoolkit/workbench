"""
 OpenVINO DL Workbench
 Class to generate job.sh script content for dataset annotation

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
import os
from pathlib import Path

from config.constants import (JOBS_SCRIPTS_FOLDER, JOBS_SCRIPTS_FOLDER_NAME,
                              DATASET_ANNOTATION_ACCURACY_CONFIGURATION_FILE_NAME, DATASET_ANNOTATOR_SCRIPT_PATH)
from wb.main.enumerates import TargetTypeEnum, JobTypesEnum
from wb.main.models import AnnotateDatasetJobModel, DatasetsModel, TargetModel
from wb.main.scripts.job_scripts_generators.job_script_generator import JobScriptGenerator, JobScriptGenerationContext
from wb.main.shared.enumerates import TaskEnum


class DatasetAnnotationJobScriptGenerationContext(JobScriptGenerationContext):
    DATASET_ANNOTATOR_PATH_IN_BUNDLE: str
    CONFIG_PATH_IN_ACCURACY_BUNDLE: str
    MODEL_TYPE: str
    IMAGES_DIR: str
    OUTPUT_DIR: str


class DatasetAnnotationScriptGenerator(JobScriptGenerator):
    _script_context = DatasetAnnotationJobScriptGenerationContext(
        **JobScriptGenerator._script_context,
        job_type=JobTypesEnum.annotate_dataset.value,
        CONFIG_PATH_IN_ACCURACY_BUNDLE=os.path.join(
            JOBS_SCRIPTS_FOLDER_NAME,
            DATASET_ANNOTATION_ACCURACY_CONFIGURATION_FILE_NAME
        ),
    )

    def __init__(self, task_type: TaskEnum, images_dir: str):
        super().__init__()
        self._script_context['MODEL_TYPE'] = task_type.value
        self._script_context['IMAGES_DIR'] = images_dir


class RemoteDatasetAnnotationJobScriptGenerator(DatasetAnnotationScriptGenerator):
    _script_context = DatasetAnnotationJobScriptGenerationContext(
        **DatasetAnnotationScriptGenerator._script_context,
        DATASET_ANNOTATOR_PATH_IN_BUNDLE=
        f'$JOB_BUNDLE_PATH/{os.path.join(JOBS_SCRIPTS_FOLDER_NAME, DATASET_ANNOTATOR_SCRIPT_PATH)}',
        OUTPUT_DIR='${ARTIFACTS_PATH}',
    )

    def __init__(self, task_type: TaskEnum):
        remote_images_path = '$JOB_BUNDLE_PATH/dataset'
        super().__init__(task_type, remote_images_path)


class LocalDatasetAnnotationJobScriptGenerator(DatasetAnnotationScriptGenerator):
    _script_context = DatasetAnnotationJobScriptGenerationContext(
        **DatasetAnnotationScriptGenerator._script_context,
        DATASET_ANNOTATOR_PATH_IN_BUNDLE=os.path.join(
            JOBS_SCRIPTS_FOLDER,
            DATASET_ANNOTATOR_SCRIPT_PATH
        ),
    )

    def __init__(self, task_type: TaskEnum, images_path: str, dataset_path: str):
        super().__init__(task_type, images_path)
        self._script_context['OUTPUT_DIR'] = dataset_path


def get_dataset_annotation_job_script_generator(annotate_dataset_job: AnnotateDatasetJobModel) \
        -> DatasetAnnotationScriptGenerator:
    target: TargetModel = annotate_dataset_job.project.target
    project = annotate_dataset_job.project
    dataset = project.dataset
    task_type = project.topology.meta.task_type
    if target.target_type == TargetTypeEnum.local:
        return LocalDatasetAnnotationJobScriptGenerator(
            task_type,
            dataset.dataset_data_dir,
            annotate_dataset_job.result_dataset.path,
        )
    return RemoteDatasetAnnotationJobScriptGenerator(task_type)
