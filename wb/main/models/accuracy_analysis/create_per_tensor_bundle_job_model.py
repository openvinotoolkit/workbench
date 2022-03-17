"""
 OpenVINO DL Workbench
 Class for ORM model describing job for creating per tensor bundle

 Copyright (c) 2021 Intel Corporation

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

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel


class CreatePerTensorBundleJobModel(JobsModel):
    __tablename__ = 'create_per_tensor_bundle_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.create_per_tensor_bundle_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)

    def json(self) -> dict:
        return {
            'jobId': self.job_id,
            'type': self.get_polymorphic_job_type(),
            'status': self.status_to_json(),
            'projectId': self.project_id
        }
