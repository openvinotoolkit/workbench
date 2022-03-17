"""
 OpenVINO DL Workbench
 Class for ORM model describing job for parsing DevCloud profiling results

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
