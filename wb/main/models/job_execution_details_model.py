"""
 OpenVINO DL Workbench
 Class for ORM model describing job execution details

 Copyright (c) 2020 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
