"""
 OpenVINO DL Workbench
 Class for ORM model describing job for uploading artifact to target

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
