"""
 OpenVINO DL Workbench
 ClassificationAccuracyReportEntityModel

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
