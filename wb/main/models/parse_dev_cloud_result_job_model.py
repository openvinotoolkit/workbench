"""
 OpenVINO DL Workbench
 Class for ORM model describing job for parsing DevCloud profiling results

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

from wb.main.models.jobs_model import JobsModel, JobData


class ParseDevCloudResultJobData(JobData):
    resultArtifactId: int


class ParseDevCloudResultJobModel(JobsModel):
    __tablename__ = 'parse_dev_cloud_result_jobs'

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)

    result_artifact_id = Column(Integer, ForeignKey('downloadable_artifacts.id'), nullable=False)

    # Relationship typings
    result_artifact = relationship('DownloadableArtifactsModel',
                                   foreign_keys=[result_artifact_id],
                                   cascade='delete,all', uselist=False)

    def __init__(self, data: ParseDevCloudResultJobData):
        super().__init__(data)
        self.result_artifact_id = data['resultArtifactId']

    def propagate_status_to_artifact(self):
        self.result_artifact.status = self.status
        self.result_artifact.progress = self.progress
        self.result_artifact.error_message = self.error_message

    def json(self) -> dict:
        return {
            **super().json(),
            'resultArtifactId': self.result_artifact_id,
        }
