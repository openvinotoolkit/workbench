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
import os

from sqlalchemy import Column, Integer, ForeignKey

from config.constants import CLOUD_SHARED_FOLDER, JOB_ARTIFACTS_FOLDER_NAME
from wb.main.enumerates import JobTypesEnum
from wb.main.models.parse_dev_cloud_result_job_model import ParseDevCloudResultJobModel


class ParseDevCloudProfilingResultJobModel(ParseDevCloudResultJobModel):
    __tablename__ = 'parse_dev_cloud_profiling_result_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.parse_dev_cloud_profiling_result_job.value
    }

    job_id = Column(Integer, ForeignKey(ParseDevCloudResultJobModel.job_id), primary_key=True)

    @property
    def job_result_path(self) -> str:
        return os.path.join(CLOUD_SHARED_FOLDER, str(self.pipeline_id), JOB_ARTIFACTS_FOLDER_NAME)
