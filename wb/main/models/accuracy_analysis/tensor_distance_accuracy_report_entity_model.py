"""
 OpenVINO DL Workbench
 Class for ORM model described Accuracy Tensor Distance Report Image Class

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
