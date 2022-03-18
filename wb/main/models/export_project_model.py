"""
 OpenVINO DL Workbench
 Class for ORM model describing job for creating setup bundle

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

from sqlalchemy import Column, Integer, ForeignKey, Boolean, String

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel
from wb.main.models.accuracy_model import AccuracyJobsModel


class ExportProjectJobModel(JobsModel):
    __tablename__ = 'export_project'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.export_project_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    accuracy_job_id = Column(Integer, ForeignKey(AccuracyJobsModel.job_id), nullable=True)
    tab_id = Column(String, nullable=True)

    include_model = Column(Boolean, nullable=False)
    include_dataset = Column(Boolean, nullable=False)
    include_accuracy_config = Column(Boolean, nullable=False)
    include_calibration_config = Column(Boolean, nullable=False)

    def __init__(self, data: dict):
        super().__init__(data)
        self.include_model = data['includeModel']
        self.include_dataset = data['includeDataset']
        self.include_accuracy_config = data['includeAccuracyConfig']
        self.include_calibration_config = data['includeCalibrationConfig']
        self.tab_id = data['tabId']
        self.pipeline_id = data['pipelineId']

    def json(self):
        return {
            'status': self.pipeline.status_to_json(),
            'artifactId': self.downloadable_artifact.id,
            'tabId': self.tab_id,
            'projectName': self.downloadable_artifact.name,
            'projectId': self.project_id
        }

    def update_accuracy_job(self, accuracy_job_id: int):
        self.accuracy_job_id = accuracy_job_id
