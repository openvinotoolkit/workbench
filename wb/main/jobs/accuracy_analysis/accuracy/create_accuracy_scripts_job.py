"""
 OpenVINO DL Workbench
 Class for creating accuracy scripts job

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
import json
from contextlib import closing
from pathlib import Path

import yaml
from sqlalchemy.orm import Session

from config.constants import (ACCURACY_ARTIFACTS_FOLDER, JOBS_SCRIPTS_FOLDER_NAME,
                              ACCURACY_CONFIGURATION_FILE_NAME, JOB_SCRIPT_NAME)
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.accuracy_utils.accuracy_utils import (construct_accuracy_tool_config,
                                                   construct_auto_annotated_dataset_conversion)
from wb.main.enumerates import JobTypesEnum, StatusEnum, TargetTypeEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.utils.utils import set_assets_path_for_remote_target
from wb.main.models import (DatasetsModel, ProjectsModel, TopologiesModel, PipelineModel, AccuracyJobsModel,
                            ProjectAccuracyModel, CreateAccuracyScriptsJobModel)
from wb.main.scripts.job_scripts_generators.accuracy_job_script_generator import get_accuracy_job_script_generator
from wb.main.shared.enumerates import TaskEnum
from wb.main.utils.utils import create_empty_dir


class CreateAccuracyScriptsJob(IJob):
    job_type = JobTypesEnum.create_accuracy_scripts_type
    _job_model_class = CreateAccuracyScriptsJobModel
    _supported_tasks_for_report = {
        TaskEnum.classification,
        TaskEnum.object_detection,
        TaskEnum.semantic_segmentation,
        TaskEnum.instance_segmentation,
    }

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, progress=0)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job_model: CreateAccuracyScriptsJobModel = self.get_job_model(session)
            accuracy_artifacts_path = Path(ACCURACY_ARTIFACTS_FOLDER) / str(job_model.pipeline_id)
            scripts_path = accuracy_artifacts_path / JOBS_SCRIPTS_FOLDER_NAME
            config_file_path = scripts_path / ACCURACY_CONFIGURATION_FILE_NAME
            job_script_file_path = scripts_path / JOB_SCRIPT_NAME
            create_empty_dir(accuracy_artifacts_path)
            task_type: TaskEnum = job_model.project.topology.meta.task_type
            pipeline_id: TaskEnum = job_model.pipeline_id
            self._create_configuration_file(config_file_path, session)
            accuracy_job_model: AccuracyJobsModel = (
                session.query(AccuracyJobsModel).filter_by(pipeline_id=pipeline_id).first()
            )
            profile = task_type in self._supported_tasks_for_report

            job_script_generator = get_accuracy_job_script_generator(
                accuracy_job=accuracy_job_model,
                profile=profile
            )
        job_script_generator.create(
            job_script_file_path,
        )

        self.on_success()

    def _create_configuration_file(self, configuration_file_path: Path, session: Session):
        config = self._get_config(session)
        create_empty_dir(configuration_file_path.parent)
        with open(configuration_file_path, 'w') as configuration_file:
            yaml.safe_dump(config, configuration_file)

    def _get_config(self, session: Session) -> dict:
        create_script_job = self.get_job_model(session)
        pipeline: PipelineModel = create_script_job.pipeline
        project: ProjectsModel = create_script_job.project

        accuracy_job_model: AccuracyJobsModel = (
            session.query(AccuracyJobsModel).filter_by(pipeline_id=pipeline.id).first()
        )
        topology: TopologiesModel = project.topology
        target_dataset: DatasetsModel = accuracy_job_model.target_dataset
        device = project.device
        # if raw config exists - use it
        project_accuracy: ProjectAccuracyModel = project.accuracy

        if project_accuracy:
            accuracy_config = json.loads(project_accuracy.raw_configuration)
        else:
            # if no raw config - construct one using model analysis info
            accuracy_model = construct_accuracy_tool_config(topology, target_dataset, device)
            accuracy_config = accuracy_model.to_dict()
        if target_dataset.is_auto_annotated:
            task_type: TaskEnum = project.topology.meta.task_type
            self._apply_auto_annotated_dataset_conversion(task_type=task_type, target_dataset=target_dataset,
                                                          accuracy_config=accuracy_config)
        accuracy_job_model.accuracy_config = json.dumps(accuracy_config)
        accuracy_job_model.write_record(session)
        if project.target.target_type != TargetTypeEnum.local:
            set_assets_path_for_remote_target(accuracy_config, topology, target_dataset)
        return accuracy_config

    @staticmethod
    def _apply_auto_annotated_dataset_conversion(task_type: TaskEnum, target_dataset: DatasetsModel,
                                                 accuracy_config: dict):
        """
        Apply auto annotated dataset annotation conversion and datasource to provided accuracy config.
        This method mutates `accuracy_config`
        """
        annotation_conversion = construct_auto_annotated_dataset_conversion(task_type, target_dataset)
        dataset_config = accuracy_config['models'][0]['datasets'][0]
        dataset_config['annotation_conversion'] = annotation_conversion['annotation_conversion']
        dataset_config['data_source'] = annotation_conversion['data_source']

        if 'additional_data_source' in annotation_conversion:
            dataset_config['additional_data_source'] = annotation_conversion['additional_data_source']

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready, progress=100)
        self._job_state_subject.detach_all_observers()
