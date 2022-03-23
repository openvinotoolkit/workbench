"""
 OpenVINO DL Workbench
 Class for ORM model describing job for creating int8 calibration scripts

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

from sqlalchemy import Column, Integer, ForeignKey

from config.constants import JOBS_SCRIPTS_FOLDER_NAME, INT8_CALIBRATION_CONFIGURATION_FILE_NAME, JOB_SCRIPT_NAME, \
    INT8_CALIBRATION_ARTIFACTS_PATH, JOB_ARTIFACTS_FOLDER_NAME
from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel


class CreateInt8CalibrationScriptsJobModel(JobsModel):
    __tablename__ = 'create_int8_calibration_scripts_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.create_int8_calibration_scripts_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)

    @property
    def int8_calibration_artifacts_path(self) -> str:
        return os.path.join(INT8_CALIBRATION_ARTIFACTS_PATH, str(self.pipeline_id))

    @property
    def job_artifacts_path(self) -> str:
        return os.path.join(self.int8_calibration_artifacts_path, JOB_ARTIFACTS_FOLDER_NAME)

    @property
    def scripts_path(self) -> str:
        return os.path.join(self.int8_calibration_artifacts_path, JOBS_SCRIPTS_FOLDER_NAME)

    @property
    def int8_config_file_path(self) -> str:
        return os.path.join(self.scripts_path, INT8_CALIBRATION_CONFIGURATION_FILE_NAME)

    @property
    def job_script_file_path(self) -> str:
        return os.path.join(self.scripts_path, JOB_SCRIPT_NAME)
