"""
 OpenVINO DL Workbench
 Class for ORM model described a dataset generation config

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

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel


class ProjectReportExportJobModel(JobsModel):
    __tablename__ = 'project_report_export_job'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.export_project_report.value
    }
    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    tab_id = Column(String, nullable=True)

    def __init__(self, data: dict):
        super().__init__(data)
        self.tab_id = data['tabId']

    def json(self):
        return {
            **super().json(),
            'tabId': self.tab_id,
            'projectId': self.project_id,
            'artifactId': self.downloadable_artifact.id,
        }
