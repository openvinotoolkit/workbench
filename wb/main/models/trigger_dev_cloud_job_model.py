"""
 OpenVINO DL Workbench
 Class for ORM model describing job for running profiling in DevCloud

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
from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from wb.main.enumerates import JobTypesEnum, DevCloudRemoteJobTypeEnum
from wb.main.models.enumerates import DEV_CLOUD_REMOTE_JOB_TYPE_ENUM_SCHEMA
from wb.main.models.jobs_model import JobsModel, JobData


class TriggerDevCloudJobData(JobData):
    setupBundleId: int
    jobBundleId: int
    remoteJobType: DevCloudRemoteJobTypeEnum


class TriggerDevCloudJobModel(JobsModel):
    __tablename__ = 'trigger_dev_cloud_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.trigger_dev_cloud_job.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    setup_bundle_id = Column(Integer, ForeignKey('downloadable_artifacts.id'), nullable=False)
    job_bundle_id = Column(Integer, ForeignKey('downloadable_artifacts.id'), nullable=False)

    remote_job_type = Column(DEV_CLOUD_REMOTE_JOB_TYPE_ENUM_SCHEMA, nullable=False,
                             default=DevCloudRemoteJobTypeEnum.profiling)

    # Relationships
    setup_bundle = relationship('DownloadableArtifactsModel', foreign_keys=[setup_bundle_id], cascade='delete,all',
                                uselist=False)
    job_bundle = relationship('DownloadableArtifactsModel', foreign_keys=[job_bundle_id],
                              cascade='delete,all', uselist=False)

    def __init__(self, data: TriggerDevCloudJobData):
        super().__init__(data)
        self.setup_bundle_id = data['setupBundleId']
        self.job_bundle_id = data['jobBundleId']
        self.remote_job_type = data['remoteJobType']

    def json(self) -> dict:
        return {
            'jobId': self.job_id,
            'type': self.get_polymorphic_job_type(),
            'status': self.status_to_json(),
            'pipelineId': self.pipeline_id,
            'projectId': self.project_id,
            'setupBundleId': self.setup_bundle_id,
            'jobBundleId': self.job_bundle_id,
            'remoteJobType': self.remote_job_type.value,
        }
