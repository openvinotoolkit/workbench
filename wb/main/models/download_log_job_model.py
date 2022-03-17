"""
 OpenVINO DL Workbench
 Class for ORM model described an DownloadLog

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
from sqlalchemy import Integer, Column, ForeignKey, String

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel


class DownloadLogJobModel(JobsModel):
    __tablename__ = 'download_log'
    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.download_log_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    tab_id = Column(String, nullable=True)

    def __init__(self, data):
        super().__init__(data)
        self.tab_id = data.get('tabId')

    def json(self) -> dict:
        return {
            **super().json(),
            'tabId': self.tab_id,
            'artifactId': self.downloadable_artifact.id,
        }
