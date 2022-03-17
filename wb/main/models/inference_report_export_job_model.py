"""
 OpenVINO DL Workbench
 Class for ORM model described a inference report export

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
            'artifactId': self.downloadable_artifact.id,
        }
