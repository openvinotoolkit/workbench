"""
 OpenVINO DL Workbench
 Class for ORM model describing job for creating reshape model scripts

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

from sqlalchemy import Column, Integer, ForeignKey

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel


class CreateReshapeModelScriptsJobModel(JobsModel):
    __tablename__ = 'create_reshape_model_scripts_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.create_reshape_model_scripts_job.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
