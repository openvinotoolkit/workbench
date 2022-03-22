"""
 OpenVINO DL Workbench
 Class for annotate dataset job

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
import json
from contextlib import closing
from pathlib import Path
import yaml

from config.constants import (JOBS_SCRIPTS_FOLDER_NAME, JOB_SCRIPT_NAME,
                              DATASET_ANNOTATION_ACCURACY_CONFIGURATION_FILE_NAME, DATASET_ANNOTATION_ARTIFACTS_FOLDER)
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.accuracy_utils.accuracy_utils import construct_visualization_config, construct_accuracy_tool_config
from wb.main.enumerates import StatusEnum, JobTypesEnum, TargetTypeEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.utils.utils import set_assets_path_for_remote_target
from wb.main.models import (ProjectsModel, AnnotateDatasetJobModel, TopologiesModel,
                            CreateAnnotateDatasetScriptsJobModel)
from wb.main.scripts.job_scripts_generators import get_dataset_annotation_job_script_generator
from wb.main.shared.enumerates import DatasetTypesEnum
from wb.main.utils.utils import create_empty_dir


class CreateAnnotateDatasetScriptsJob(IJob):
    job_type = JobTypesEnum.create_annotate_dataset_scripts_type
    _job_model_class = CreateAnnotateDatasetScriptsJobModel

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, progress=0)
        with closing(get_db_session_for_celery()) as session:
            job_model: CreateAnnotateDatasetScriptsJobModel = self.get_job_model(session)
            project: ProjectsModel = job_model.project
            accuracy_artifacts_path = Path(DATASET_ANNOTATION_ARTIFACTS_FOLDER) / str(job_model.pipeline_id)
            scripts_path = accuracy_artifacts_path / JOBS_SCRIPTS_FOLDER_NAME
            config_file_path = scripts_path / DATASET_ANNOTATION_ACCURACY_CONFIGURATION_FILE_NAME
            job_script_file_path = scripts_path / JOB_SCRIPT_NAME
            create_empty_dir(accuracy_artifacts_path)
            self._create_configuration_file(config_file_path, project)

            annotate_dataset_job_model: AnnotateDatasetJobModel = (
                session.query(AnnotateDatasetJobModel).filter_by(pipeline_id=job_model.pipeline.id).first()
            )

            job_script_generator = get_dataset_annotation_job_script_generator(
                annotate_dataset_job=annotate_dataset_job_model,
            )
        job_script_generator.create(
            job_script_file_path,
        )
        self.on_success()

    def _create_configuration_file(self, configuration_file_path: Path, project: ProjectsModel):
        config = self._get_config(project)
        create_empty_dir(configuration_file_path.parent)
        with open(configuration_file_path, 'w') as configuration_file:
            yaml.safe_dump(config, configuration_file)

    @staticmethod
    def _get_config(project: ProjectsModel) -> dict:
        if project.accuracy:
            accuracy_config = json.loads(project.accuracy.raw_configuration)
        elif project.dataset.dataset_type == DatasetTypesEnum.not_annotated:
            annotation_configuration = project.topology.meta.json()
            accuracy_config = construct_visualization_config(project.topology, project.device,
                                                             annotation_configuration).to_dict()
        else:
            # TODO Double check if the last else branch can be removed and combined with
            #  `construct_visualization_config` not only for auto annotated dataset
            accuracy_config = construct_accuracy_tool_config(project.topology,
                                                             project.dataset, project.device).to_dict()

        # To annotate a dataset we should get accuracy config of project's model (mostly INT8 optimized),
        # But set to this config paths to XML and BIN files of the parent model.
        topology: TopologiesModel = project.topology
        original_model = topology.original_model
        xml_file, bin_file = original_model.files_paths

        accuracy_config['models'][0]['launchers'][0]['model'] = xml_file
        accuracy_config['models'][0]['launchers'][0]['weights'] = bin_file
        if project.target.target_type != TargetTypeEnum.local:
            set_assets_path_for_remote_target(accuracy_config, original_model, project.dataset)
        return accuracy_config

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready, progress=100)
        self._job_state_subject.detach_all_observers()
