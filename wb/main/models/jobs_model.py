"""
 OpenVINO DL Workbench
 Class for ORM model described Job

 Copyright (c) 2018 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
from typing import Optional, List
try:
    from typing import TypedDict
except ImportError:
    from typing_extensions import TypedDict

from sqlalchemy import Column, String, Integer, ForeignKey, Float, event
from sqlalchemy.orm import relationship, backref, Mapper, sessionmaker

from wb.main.enumerates import StatusEnum
from wb.main.models.base_model import BaseModel
from wb.main.models.enumerates import STATUS_ENUM_SCHEMA
from wb.main.models.job_execution_details_model import JobExecutionDetailsModel
from wb.main.models.pipeline_model import PipelineModel


class JobData(TypedDict):
    projectId: Optional[int]
    previousJobId: Optional[int]
    pipelineId: Optional[int]


class JobsModel(BaseModel):
    __tablename__ = 'jobs'

    job_type = Column(String(50))

    __mapper_args__ = {
        'polymorphic_identity': 'job',
        'polymorphic_on': job_type
    }

    job_id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(String, nullable=True)

    project_id = Column(Integer, ForeignKey('projects.id'), nullable=True)
    parent_job = Column(Integer, ForeignKey(f'{__tablename__}.job_id'), nullable=True, default=None)
    pipeline_id = Column(Integer, ForeignKey(PipelineModel.id), nullable=True, default=None)

    progress = Column(Float, nullable=False)

    status: StatusEnum = Column(STATUS_ENUM_SCHEMA, nullable=False, default=StatusEnum.queued)
    error_message = Column(String, nullable=True)

    # Relationships
    next_job: Optional['JobsModel'] = relationship('JobsModel',
                                                   backref=backref('previous_job', remote_side=[job_id]),
                                                   uselist=False)

    project: Optional['ProjectsModel'] = relationship('ProjectsModel',
                                                      backref=backref('jobs', cascade='delete,all'),
                                                      foreign_keys=[project_id])

    pipeline: Optional[PipelineModel] = relationship('PipelineModel',
                                                     cascade='delete,all',
                                                     backref=backref('jobs', cascade='delete,all'),
                                                     foreign_keys=[pipeline_id], uselist=False)
    # Relationship backref typing
    previous_job: Optional['JobsModel']
    execution_details: JobExecutionDetailsModel
    downloadable_artifacts: Optional['DownloadableArtifactsModel']

    def __init__(self, data: JobData = None):
        data = data or {}
        self.project_id = data.get('projectId')
        self.parent_job = data.get('previousJobId')
        self.pipeline_id = data.get('pipelineId')
        self.progress = 0

    @classmethod
    def get_polymorphic_job_type(cls) -> str:
        return cls.__mapper_args__['polymorphic_identity']

    @property
    def next_jobs(self) -> List['JobsModel']:
        if not self.next_job:
            return []
        return [self.next_job, *self.next_job.next_jobs]

    @property
    def next_jobs_in_pipeline(self) -> List['JobsModel']:
        if not self.pipeline:
            return []
        sorted_jobs = sorted(self.pipeline.jobs, key=lambda job: job.job_id)
        return [job for job in sorted_jobs if job.job_id > self.job_id]

    def json(self) -> dict:
        result = {
            'jobId': self.job_id,
            'previousJobId': self.parent_job,
            'type': self.get_polymorphic_job_type(),
            'date': str(self.creation_timestamp),
            'status': self.status_to_json()
        }
        if self.project:
            result.update(self.project.json())
            result['projectId'] = result['id']
            del result['id']
        return result

    def status_to_json(self) -> dict:
        status = {
            'name': self.status.value,
            'progress': self.progress
        }
        if self.error_message:
            status['errorMessage'] = self.error_message
        return status


@event.listens_for(JobsModel, 'after_insert', propagate=True)
def create_execution_details_for_new_job(_: Mapper, connection, job: JobsModel):
    if not job.pipeline_id:
        return
    session_maker = sessionmaker(bind=connection, autocommit=False)
    session = session_maker()
    job_execution_details = JobExecutionDetailsModel(job_id=job.job_id)
    session.add(job_execution_details)
    session.commit()
    session.close()
