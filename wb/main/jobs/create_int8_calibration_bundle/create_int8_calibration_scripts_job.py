"""
 OpenVINO DL Workbench
 Class for creating int8 optimization scripts job

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

from sqlalchemy.orm import Session

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.calibration_abstractions.utils import construct_calibration_tool_config
from wb.main.enumerates import JobTypesEnum, StatusEnum, TargetTypeEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.utils.utils import set_assets_path_for_remote_target
from wb.main.models import (CreateInt8CalibrationScriptsJobModel, Int8CalibrationJobModel, ProjectsModel,
                            TopologiesModel, PipelineModel)
from wb.main.scripts.job_scripts_generators import Int8CalibrationJobScriptGenerator
from wb.main.utils.utils import create_empty_dir


class CreateInt8CalibrationScriptsJob(IJob):
    job_type = JobTypesEnum.create_int8_calibration_scripts_type
    _job_model_class = CreateInt8CalibrationScriptsJobModel

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, progress=0)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job_model: CreateInt8CalibrationScriptsJobModel = self.get_job_model(session)
            scripts_path = job_model.scripts_path
            int8_config_file_path = job_model.int8_config_file_path
            job_script_file_path = job_model.job_script_file_path
        create_empty_dir(scripts_path)

        self._create_configuration_file(int8_config_file_path)
        job_script_generator = Int8CalibrationJobScriptGenerator()
        job_script_generator.create(job_script_file_path)

        self.on_success()

    def _create_configuration_file(self, configuration_file_path: str):
        config = self._get_config()
        with open(configuration_file_path, 'w') as configuration_file:
            json.dump(config, configuration_file)

    def _get_config(self) -> dict:
        with closing(get_db_session_for_celery()) as session:
            session: Session
            create_bundle_job = self.get_job_model(session)
            pipeline: PipelineModel = create_bundle_job.pipeline
            project: ProjectsModel = create_bundle_job.project

            int8_calibration_job_model: Int8CalibrationJobModel = (
                session.query(Int8CalibrationJobModel).filter_by(pipeline_id=pipeline.id).first()
            )
            topology: TopologiesModel = int8_calibration_job_model.project.topology
            dataset = int8_calibration_job_model.dataset
            original_topology = topology.optimized_from_record
            config = construct_calibration_tool_config(original_topology, int8_calibration_job_model)
            json_config = config.json()
            if project.target.target_type != TargetTypeEnum.local:
                set_assets_path_for_remote_target(json_config, original_topology, dataset)
        return json_config

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready, progress=100)
        self._job_state_subject.detach_all_observers()
