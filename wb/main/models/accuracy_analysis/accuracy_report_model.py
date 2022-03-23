"""
 OpenVINO DL Workbench
 Class for ORM model described Accuracy Report

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
from collections import defaultdict
from typing import Optional

from sqlalchemy import Column, Integer, ForeignKey, String, Float, event
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import AccuracyReportTypeEnum
from wb.main.models.base_model import BaseModel
from wb.main.models.enumerates import ACCURACY_REPORT_TYPE_ENUM, TASK_ENUM_SCHEMA
from wb.main.shared.enumerates import TaskEnum


class AccuracyReportModel(BaseModel):
    __tablename__ = 'accuracy_reports'

    id = Column(Integer, primary_key=True, autoincrement=True)

    report_type = Column(ACCURACY_REPORT_TYPE_ENUM, nullable=False)

    task_type = Column(TASK_ENUM_SCHEMA, nullable=True)

    __mapper_args__ = {
        'polymorphic_on': report_type,
    }

    metric_type = Column(String, nullable=True)

    metric_name = Column(String, nullable=True)

    accuracy_result = Column(Float, nullable=True)

    accuracy_postfix = Column(String, nullable=True)

    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)

    target_dataset_id = Column(Integer, ForeignKey('datasets.id'), nullable=False)

    project = relationship('ProjectsModel', uselist=False, backref=backref('accuracy_reports', cascade='delete'))

    target_dataset = relationship('DatasetsModel', uselist=False, backref=backref('accuracy_reports', cascade='delete'))

    # pylint: disable=too-many-arguments
    def __init__(
            self,
            project_id: int,
            report_type: AccuracyReportTypeEnum,
            metric_type: str,
            target_dataset_id: int,
            task_type: Optional[TaskEnum] = None,
            metric_name: str = None,
            accuracy_result: float = None,
            accuracy_postfix: str = None,
    ):
        self.report_type = report_type
        self.metric_type = metric_type
        self.metric_name = metric_name
        self.accuracy_result = accuracy_result
        self.accuracy_postfix = accuracy_postfix
        self.task_type = task_type
        self.project_id = project_id
        self.target_dataset_id = target_dataset_id

    def json(self) -> dict:
        return {
            'id': self.id,
            'reportType': self.report_type.value if self.report_type else None,
            'taskType': self.task_type.value if self.task_type else None,
            'metricType': self.metric_type,
            'metricName': self.metric_name,
            'accuracyResult': self.accuracy_result,
            'accuracyPostfix': self.accuracy_postfix,
            'projectId': self.project_id,
            'targetDatasetId': self.target_dataset_id,
        }


# there is a AccuracyReportModel subclass for AccuracyReportTypeEnum.parent_model_per_tensor report type with
# a relative polymorphic identity
# do not fail and return AccuracyReportModel for undefined polymorphic identity
@event.listens_for(AccuracyReportModel, 'mapper_configured')
# pylint: disable=unused-argument
def receive_mapper_configured(mapper, class_):
    mapper.polymorphic_map = defaultdict(lambda: mapper, mapper.polymorphic_map)
