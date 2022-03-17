"""
 OpenVINO DL Workbench
 Class for creating scripts of reshape tool

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

from sqlalchemy.orm import Session

from config.constants import (RESHAPE_MODEL_ARTIFACTS_PATH, JOBS_SCRIPTS_FOLDER_NAME, JOB_SCRIPT_NAME,
                              RESHAPE_MODEL_CONFIG_FILE_NAME)
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.models import CreateReshapeModelScriptsJobModel, ReshapeModelJobModel, ModelShapeConfigurationModel
from wb.main.scripts.job_scripts_generators.reshape_model_script_generator import ReshapeModelScriptGenerator
from wb.main.utils.utils import create_empty_dir


class CreateReshapeModelScriptsJob(IJob):
    job_type = JobTypesEnum.create_reshape_model_scripts_job
    _job_model_class = CreateReshapeModelScriptsJobModel

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, progress=0)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job_model: CreateReshapeModelScriptsJobModel = self.get_job_model(session)
            pipeline_id = job_model.pipeline_id
            scripts_dir = RESHAPE_MODEL_ARTIFACTS_PATH / str(pipeline_id) / JOBS_SCRIPTS_FOLDER_NAME
            create_empty_dir(scripts_dir)

        model_shape_config_file_path = scripts_dir / RESHAPE_MODEL_CONFIG_FILE_NAME
        self._create_configuration_file(model_shape_config_file_path)

        job_script_generator = ReshapeModelScriptGenerator()
        job_script_generator.create(scripts_dir / JOB_SCRIPT_NAME)

        self.on_success()

    def _create_configuration_file(self, configuration_file_path: str):
        config = self._get_config()
        with open(configuration_file_path, 'w') as configuration_file:
            json.dump(config, configuration_file)

    def _get_config(self) -> dict:
        with closing(get_db_session_for_celery()) as session:
            job_model: CreateReshapeModelScriptsJobModel = self.get_job_model(session)
            pipeline_id = job_model.pipeline_id
            reshape_model_job_model: ReshapeModelJobModel = (
                session.query(ReshapeModelJobModel).filter_by(pipeline_id=pipeline_id).first()
            )
            save_reshaped_model = reshape_model_job_model.save_reshaped_model
            xml_path, bin_path = reshape_model_job_model.model.files_paths

            shape_configuration: ModelShapeConfigurationModel = reshape_model_job_model.shape_model_configuration

            config_content = {
                'xml_path': xml_path,
                'bin_path': bin_path,
                'inputs_shape_configuration': shape_configuration.shape_configuration
            }

        if save_reshaped_model:
            config_content['dump_reshaped_model'] = True
            config_content['output_dir'] = str(Path(xml_path).parent)

        return config_content

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready, progress=100)
        self._job_state_subject.detach_all_observers()
