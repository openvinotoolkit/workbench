"""
 OpenVINO DL Workbench
 Class for ORM model describing job for creating per tensor bundle

 Copyright (c) 2021 Intel Corporation

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
