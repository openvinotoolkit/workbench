"""
 OpenVINO DL Workbench
 Class for ORM model described Accuracy Tensor Distance Report Image Class

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
from typing import cast, Dict

from sqlalchemy import Column, Integer, ForeignKey, String, Float
from sqlalchemy.orm import relationship, backref

from wb.main.accuracy_report.query_string_parameters_parser import QueryApiModel, QueryableColumnLike
from wb.main.models.base_model import BaseModel


# pylint: disable=too-many-instance-attributes
class TensorDistanceAccuracyReportEntityModel(BaseModel):
    __tablename__ = 'tensor_distance_accuracy_report_entities'

    id = Column(Integer, primary_key=True, autoincrement=True)

    report_id = Column(Integer, ForeignKey('accuracy_reports.id'))

    image_name = Column(String, nullable=False)

    output_name = Column(String, nullable=False)

    mse = Column(Float, nullable=False)

    report = relationship(
        'AccuracyReportModel', uselist=False, backref=backref('tensor_distance_entities', cascade='delete')
    )

    @classmethod
    def query_api(cls) -> QueryApiModel:
        return QueryApiModel(
            query=cls.query,
            columns=cast(Dict[str, QueryableColumnLike], {
                'image_name': cls.image_name,
                'output_name': cls.output_name,
                'mse': cls.mse,
            }),
            # query is an orm model query, thus orm model expected as a result
            to_json=lambda query_result: query_result.json(),
        )

    # pylint: disable=too-many-arguments
    def __init__(
            self,
            report_id: int,
            image_name: str,
            output_name: str,
            mse: float,
    ):
        self.report_id = report_id
        self.image_name = image_name
        self.output_name = output_name
        self.mse = mse

    def json(self) -> dict:
        # todo: use camelCase + adjust query strings mappings
        return {
            'id': self.id,
            'report_id': self.report_id,
            'image_name': self.image_name,
            'output_name': self.output_name,
            'mse': self.mse,
        }
