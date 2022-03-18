"""
 OpenVINO DL Workbench
 Class for ORM model described a dataset generation config

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
