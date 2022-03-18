"""
 OpenVINO DL Workbench
 Class for ORM model described Accuracy Tensor Distance Report

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
import json
from typing import List

from sqlalchemy import Column, Text, Integer, ForeignKey

from wb.main.enumerates import AccuracyReportTypeEnum
from wb.main.models.accuracy_analysis.accuracy_report_model import AccuracyReportModel


class TensorDistanceAccuracyReportModel(AccuracyReportModel):
    __tablename__ = 'tensor_distance_accuracy_reports'

    __mapper_args__ = {
        'polymorphic_identity': AccuracyReportTypeEnum.parent_model_per_tensor
    }

    id = Column(Integer, ForeignKey(AccuracyReportModel.id), primary_key=True)

    output_names = Column(Text, nullable=False)

    def __init__(
            self,
            output_names: List[str],
            project_id: int,
            target_dataset_id: int,
    ):
        super().__init__(
            project_id=project_id,
            report_type=AccuracyReportTypeEnum.parent_model_per_tensor,
            metric_type='tensor_distance',
            metric_name='tensor_distance',
            target_dataset_id=target_dataset_id,
        )
        self.output_names = json.dumps(output_names)

    def json(self) -> dict:
        return {
            **super().json(),
            'outputNames': json.loads(self.output_names),
        }
