"""
 OpenVINO DL Workbench
 Class for ORM model describing job execution details

 Copyright (c) 2020 Intel Corporation

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
from sqlalchemy import Column, Integer, ForeignKey, String, Float, Text
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import PipelineStageEnum
from wb.main.models.base_model import BaseModel
from wb.main.models.enumerates import PIPELINE_STAGE_ENUM_SCHEMA, STATUS_ENUM_SCHEMA


class JobExecutionDetailsModel(BaseModel):
    __tablename__ = 'job_execution_details'

    job_id = Column(Integer, ForeignKey('jobs.job_id'), primary_key=True)
    stage = Column(PIPELINE_STAGE_ENUM_SCHEMA, nullable=True)
    logs = Column(Text, nullable=True)
    progress = Column(Float, nullable=True)
    status = Column(STATUS_ENUM_SCHEMA, nullable=True)
    error_message = Column(String, nullable=True)
    warning_message = Column(String, nullable=True)

    # Relationships
    job: 'JobsModel' = relationship('JobsModel',
                                    backref=backref('execution_details', cascade='all,delete', uselist=False),
                                    uselist=False)

    def __init__(self, job_id: int, stage: PipelineStageEnum = None):
        self.job_id = job_id
        self.stage = stage

    def json(self) -> dict:
        return {
            'jobId': self.job_id,
            'targetId': self.job.pipeline.target_id,
            'pipelineId': self.job.pipeline.id,
            'stage': self.stage.value,
            'logs': self.logs,
            'progress': self.progress,
            'status': self.status.value if self.status else None,
            'errorMessage': self.error_message,
            'warningMessage': self.warning_message
        }

    def add_log(self, value: str):
        if self.logs is None:
            self.logs = ''
        else:
            self.logs = self.logs + '\n'
        self.logs = self.logs + value
