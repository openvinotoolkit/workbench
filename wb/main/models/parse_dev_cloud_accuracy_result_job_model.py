"""
 OpenVINO DL Workbench
 Class for ORM model describing job for parsing DevCloud accuracy results

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
from wb.main.models.parse_dev_cloud_result_job_model import ParseDevCloudResultJobModel


class ParseDevCloudAccuracyResultJobModel(ParseDevCloudResultJobModel):
    __tablename__ = 'parse_dev_cloud_accuracy_result_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.parse_dev_cloud_accuracy_result_job.value
    }

    job_id = Column(Integer, ForeignKey(ParseDevCloudResultJobModel.job_id), primary_key=True)
