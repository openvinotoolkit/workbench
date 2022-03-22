"""
 OpenVINO DL Workbench
 InstanceSegmentationAccuracyReportEntityModel

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
from typing import cast, Dict, NamedTuple, List

from sqlalchemy import Column, Integer, ForeignKey, String, Text, Float, func
from sqlalchemy.orm import relationship, backref

from wb.main.accuracy_report.query_string_parameters_parser import QueryApiModel, QueryableColumnLike
from wb.main.models.base_model import BaseModel


# pylint: disable=too-many-instance-attributes
class InstanceSegmentationAccuracyReportEntityModel(BaseModel):
    __tablename__ = 'instance_segmentation_accuracy_report_entities'

    id = Column(Integer, primary_key=True, autoincrement=True)

    report_id = Column(Integer, ForeignKey('accuracy_reports.id'))

    image_name = Column(String, nullable=False)

    class_id = Column(Integer, nullable=False)

    ap_precision = Column(Float, nullable=False)

    annotations_count = Column(Integer, nullable=False)

    # json field with annotation boxes
    annotations = Column(Text, nullable=False)

    predictions_count = Column(Integer, nullable=False)

    # json field with detection boxes
    predictions = Column(Text, nullable=False)

    matches = Column(Integer, nullable=False)

    report = relationship('AccuracyReportModel', uselist=False,
                          backref=backref('instance_segmentation_entities', cascade='delete'))

    @classmethod
    def query_api(cls) -> QueryApiModel:
        return QueryApiModel(
            query=cls.query,
            columns=cast(Dict[str, QueryableColumnLike], {
                'image_name': cls.image_name,
                'class_id': cls.class_id,
                'ap_precision': cls.ap_precision,
                'annotations_count': cls.annotations_count,
                'predictions_count': cls.predictions_count,
                'matches': cls.matches,
            }),
            # query is an orm model query, thus orm model expected as a result
            to_json=lambda query_result: query_result.json(),
        )

    # pylint: disable=too-many-arguments
    def __init__(
            self,
            report_id: int,
            image_name: str,
            class_id: int,
            ap_precision: float,
            annotations_count: int,
            annotations: str,
            predictions_count: int,
            predictions: str,
            matches: int,
    ):
        self.report_id = report_id
        self.image_name = image_name
        self.class_id = class_id
        self.ap_precision = ap_precision
        self.annotations_count = annotations_count
        self.annotations = annotations
        self.predictions_count = predictions_count
        self.predictions = predictions
        self.matches = matches

    def json(self) -> dict:
        # todo: use camelCase + adjust query strings mappings
        return {
            'id': self.id,
            'report_id': self.report_id,
            'image_name': self.image_name,
            'class_id': self.class_id,
            'ap_precision': self.ap_precision,
            'annotations_count': self.annotations_count,
            'annotations': json.loads(self.annotations),
            'predictions_count': self.predictions_count,
            'predictions': json.loads(self.predictions),
            'matches': self.matches,
        }


class AggregatedInstanceSegmentationAccuracyReportQueryModel:

    @staticmethod
    def query_api() -> QueryApiModel:
        model_cls = InstanceSegmentationAccuracyReportEntityModel
        return QueryApiModel(
            query=(
                model_cls.query
                    .with_entities(
                    model_cls.image_name.label('image_name'),
                    func.sum(model_cls.predictions_count).label('predictions_count'),
                    func.sum(model_cls.annotations_count).label('annotations_count'),
                    func.sum(model_cls.matches).label('matches'),
                    func.array_agg(model_cls.class_id).label('class_ids'),
                )
                    .group_by(model_cls.image_name)
            ),
            columns={
                'image_name': model_cls.image_name,
                'class_id': model_cls.class_id,
                'annotations_count': func.sum(model_cls.annotations_count),
                'predictions_count': func.sum(model_cls.predictions_count),
                'matches': func.sum(model_cls.matches),
            },
            # query is a custom aggregated query - named tuple expected as a result
            to_json=AggregatedInstanceSegmentationAccuracyReportQueryModel.json,
            aggregated_columns={'annotations_count', 'predictions_count', 'matches'}
        )

    class AggregatedQueryResult(NamedTuple):
        image_name: str
        class_ids: List[int]
        annotations_count: int
        predictions_count: int
        matches: int

    @staticmethod
    def json(result: AggregatedQueryResult) -> dict:
        # todo: use camelCase + adjust query strings mappings
        return {
            'image_name': result.image_name,
            'class_ids': result.class_ids,
            'annotations_count': result.annotations_count,
            'predictions_count': result.predictions_count,
            'matches': result.matches,
        }
