"""
 OpenVINO DL Workbench
 Class for ORM model describing job for uploading artifact to target

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
from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.downloadable_artifacts_model import DownloadableArtifactsModel
from wb.main.models.jobs_model import JobsModel
from wb.main.models.target_model import TargetModel


class UploadArtifactToTargetJobModel(JobsModel):
    __tablename__ = 'upload_artifact_to_target_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.upload_artifact_to_target_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    artifact_id = Column(Integer, ForeignKey(DownloadableArtifactsModel.id), nullable=False)
    target_id = Column(Integer, ForeignKey(TargetModel.id), nullable=False)
    destination_directory = Column(String, nullable=True)

    # Relationships
    artifact: DownloadableArtifactsModel = relationship('DownloadableArtifactsModel', foreign_keys=[artifact_id],
                                                        cascade='delete, all',
                                                        backref=backref('upload_to_target_job',
                                                                        lazy='subquery', cascade='delete,all'))
    target: TargetModel = relationship('TargetModel', foreign_keys=[target_id], backref=backref('upload_to_target_job',
                                                                                                lazy='subquery',
                                                                                                cascade='delete,all'))

    def __init__(self, data: dict):
        super().__init__(data)
        self.artifact_id = data['artifactId']
        self.target_id = data['targetId']
        self.destination_directory = data['destinationDirectory']

    def json(self) -> dict:
        return {
            **super().json(),
            'jobId': self.job_id,
            'type': JobTypesEnum.upload_artifact_to_target_type.value,
            'status': self.status_to_json(),
            'artifactId': self.artifact_id,
            'targetId': self.target_id,
            'destinationDirectory': self.destination_directory,
        }
