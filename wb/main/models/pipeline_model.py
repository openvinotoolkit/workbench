"""
 OpenVINO DL Workbench
 Class for ORM model describing pipeline of jobs

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
from typing import List, Tuple, Set, Optional

from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import PipelineTypeEnum, StatusEnum, PipelineStageEnum
from wb.main.models.base_model import BaseModel
from wb.main.models.enumerates import PIPELINE_TYPE_ENUM_SCHEMA


class PipelineModel(BaseModel):
    __tablename__ = 'pipelines'

    id = Column(Integer, primary_key=True)
    # Unable to use TargetModel.__tablename__ due to circular import
    target_id = Column(Integer, ForeignKey('targets.id'), nullable=False)
    type: PipelineTypeEnum = Column(PIPELINE_TYPE_ENUM_SCHEMA, nullable=False)

    # Relationship backref typing
    jobs: List['JobsModel']

    # Relationships
    target: 'TargetModel' = relationship('TargetModel', backref=backref('pipelines', cascade='all,delete'))

    def __init__(self, target_id: int, pipeline_type: PipelineTypeEnum):
        self.target_id = target_id
        self.type = pipeline_type

    @property
    def last_pipeline_job(self) -> 'JobsModel':
        return max(self.jobs, key=lambda job: job.creation_timestamp)

    @property
    def pipeline_jobs_execution_details(self) -> List['JobExecutionDetailsModel']:
        return [job.execution_details for job in self.jobs]

    @property
    def pipeline_progress(self) -> float:
        jobs_count = len(self.jobs) or 1
        jobs_progress_values = [execution_details.progress or 0 for execution_details in
                                self.pipeline_jobs_execution_details]
        return sum(jobs_progress_values) / jobs_count

    # pylint: disable=too-many-return-statements
    @property
    def pipeline_status_name(self) -> StatusEnum:
        if not self.jobs:
            return StatusEnum.error
        unique_jobs_statuses: Set[StatusEnum] = {execution_details.status for execution_details in
                                                 self.pipeline_jobs_execution_details}
        # Error pipeline status if there is at least one failed job
        if StatusEnum.error in unique_jobs_statuses or unique_jobs_statuses == {None}:
            return StatusEnum.error
        # Error pipeline status if there is at least one warning job
        if StatusEnum.warning in unique_jobs_statuses:
            return StatusEnum.warning
        # Cancelled pipeline status if there is at least one cancelled job
        if StatusEnum.cancelled in unique_jobs_statuses:
            return StatusEnum.cancelled
        # Ready pipeline status if each job is ready
        if unique_jobs_statuses == {StatusEnum.ready}:
            return StatusEnum.ready
        # Queued pipeline status if each job is queued
        if unique_jobs_statuses == {StatusEnum.queued}:
            return StatusEnum.queued
        return StatusEnum.running

    @property
    def pipeline_stage(self) -> Optional[PipelineStageEnum]:
        running_jobs: Tuple['JobsModel'] = tuple(
            filter(lambda job: job.execution_details.status == StatusEnum.running, self.jobs))
        if running_jobs:
            return running_jobs[0].execution_details.stage

        completed_jobs = tuple(filter(lambda job: job.execution_details.status == StatusEnum.ready, self.jobs))
        if completed_jobs:
            last_modified_job = sorted(completed_jobs, key=lambda job: job.last_modified, reverse=True)[0]
            return last_modified_job.execution_details.stage

        failed_jobs = tuple(filter(lambda job: job.execution_details.status == StatusEnum.error, self.jobs))
        if failed_jobs:
            return failed_jobs[0].execution_details.stage

        return None

    @property
    def pipeline_error_message(self) -> Optional[str]:
        failed_jobs: Tuple['JobsModel'] = tuple(filter(lambda job: job.status == StatusEnum.error, self.jobs))
        if not failed_jobs:
            return None
        return failed_jobs[0].execution_details.error_message

    @property
    def status(self) -> Tuple[StatusEnum, float, Optional[str], Optional[str]]:
        return self.pipeline_status_name, self.pipeline_progress, self.pipeline_error_message, self.pipeline_stage

    @property
    def sorted_jobs(self) -> List['JobsModel']:
        return sorted(self.jobs, key=lambda job: job.job_id)

    @property
    def project_id(self) -> int:
        return self.last_pipeline_job.project_id

    def get_job_by_type(self, job_type: str) -> Optional['JobsModel']:
        return next((job for job in self.jobs if job.job_type == job_type), None)

    def json(self):
        return {
            'id': self.id,
            'targetId': self.target_id,
            'targetStatus': self.target.last_connection_status.value,
            'projectId': self.project_id,
            'type': self.type.value,
            'status': self.status_to_json(),
            'stages': [job.execution_details.json() for job in self.sorted_jobs],
            'jobs': [job.json() for job in self.jobs]
        }

    def status_to_json(self) -> dict:
        return {
            'name': self.pipeline_status_name.value,
            'progress': self.pipeline_progress,
            'errorMessage': self.pipeline_error_message,
            'stage': self.pipeline_stage.value if self.pipeline_stage else None
        }
