"""
 OpenVINO DL Workbench
 Class for ORM model described a inference report export

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
from wb.main.models.single_inference_info_model import SingleInferenceInfoModel
from wb.main.models.jobs_model import JobsModel


class InferenceReportExportJobModel(JobsModel):
    __tablename__ = 'inference_report_export_job'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.export_inference_report.value
    }
    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    inference_id = Column(Integer, ForeignKey(SingleInferenceInfoModel.job_id))
    tab_id = Column(String, nullable=True)

    inference: 'JobsModel' = relationship(SingleInferenceInfoModel, foreign_keys=[inference_id],
                                          backref=backref('inference_details', cascade='all,delete'))

    def __init__(self, data: dict):
        super().__init__(data)
        self.inference_id = data['inferenceId']
        self.tab_id = data['tabId']

    def json(self):
        return {
            **super().json(),
            'tabId': self.tab_id,
            'inferenceId': self.inference_id,
            'artifactId': self.shared_artifact.id,
        }
