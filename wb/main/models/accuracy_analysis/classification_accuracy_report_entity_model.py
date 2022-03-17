"""
 OpenVINO DL Workbench
 ClassificationAccuracyReportEntityModel

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
from typing import cast, Dict

from sqlalchemy import Column, Integer, ForeignKey, String, Float, Text
from sqlalchemy.orm import relationship, backref

from wb.main.accuracy_report.query_string_parameters_parser import QueryApiModel, QueryableColumnLike
from wb.main.models.base_model import BaseModel


# pylint: disable=too-many-instance-attributes
class ClassificationAccuracyReportEntityModel(BaseModel):
    __tablename__ = 'classification_accuracy_report_entities'

    id = Column(Integer, primary_key=True, autoincrement=True)

    report_id = Column(Integer, ForeignKey('accuracy_reports.id'))

    image_name = Column(String, nullable=False)

    annotation_class_id = Column(Integer, nullable=False)

    confidence_in_annotation_class_id = Column(Float, nullable=False)

    annotation_id_rank_in_predictions = Column(Integer, nullable=False)

    top_1_prediction = Column(Integer, nullable=False)

    top_1_prediction_confidence = Column(Float, nullable=False)

    # json string field List[{ category_id: 1, score: 0.1 }]
    top_k_predictions = Column(Text, nullable=False)

    report = relationship('AccuracyReportModel', uselist=False,
                          backref=backref('classification_entities', cascade='delete'))

    @classmethod
    def query_api(cls) -> QueryApiModel:
        return QueryApiModel(
            query=cls.query,
            columns=cast(Dict[str, QueryableColumnLike], {
                'image_name': cls.image_name,
                'annotation_class_id': cls.annotation_class_id,
                'confidence_in_annotation_class_id': cls.confidence_in_annotation_class_id,
                'annotation_id_rank_in_predictions': cls.annotation_id_rank_in_predictions,
                'top_1_prediction': cls.top_1_prediction,
                'top_1_prediction_confidence': cls.top_1_prediction_confidence,
            }),
            # query is an orm model query, thus orm model expected as a result
            to_json=lambda query_result: query_result.json(),
        )

    # pylint: disable=too-many-arguments
    def __init__(
            self,
            report_id: int,
            image_name: str,
            annotation_class_id: int,
            confidence_in_annotation_class_id: float,
            annotation_id_rank_in_predictions: int,
            top_1_prediction: int,
            top_1_prediction_confidence: float,
            top_k_predictions: str,
    ):
        self.report_id = report_id
        self.image_name = image_name
        self.annotation_class_id = annotation_class_id
        self.confidence_in_annotation_class_id = confidence_in_annotation_class_id
        self.annotation_id_rank_in_predictions = annotation_id_rank_in_predictions
        self.top_1_prediction = top_1_prediction
        self.top_1_prediction_confidence = top_1_prediction_confidence
        self.top_k_predictions = top_k_predictions

    def json(self) -> dict:
        # todo: use camelCase + adjust query strings mappings
        return {
            'id': self.id,
            'report_id': self.report_id,
            'image_name': self.image_name,
            'annotation_class_id': self.annotation_class_id,
            'confidence_in_annotation_class_id': self.confidence_in_annotation_class_id,
            'annotation_id_rank_in_predictions': self.annotation_id_rank_in_predictions,
            'top_1_prediction': self.top_1_prediction,
            'top_1_prediction_confidence': self.top_1_prediction_confidence,
            'top_k_predictions': json.loads(self.top_k_predictions) if self.top_k_predictions else None,
        }
