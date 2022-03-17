"""
 OpenVINO DL Workbench
 Class for ORM model described Accuracy Tensor Distance Report

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
