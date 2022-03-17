"""
 OpenVINO DL Workbench
 SemanticSegmentationAccuracyReportEntityModel

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
from typing import cast, Dict, NamedTuple, List

from sqlalchemy import Column, Integer, ForeignKey, String, Text, Float, func
from sqlalchemy.orm import relationship, backref

from wb.main.accuracy_report.query_string_parameters_parser import QueryApiModel, QueryableColumnLike
from wb.main.models.base_model import BaseModel


# pylint: disable=too-many-instance-attributes
class SemanticSegmentationAccuracyReportEntityModel(BaseModel):
    __tablename__ = 'semantic_segmentation_accuracy_report_entities'

    id = Column(Integer, primary_key=True, autoincrement=True)

    report_id = Column(Integer, ForeignKey('accuracy_reports.id'))

    image_name = Column(String, nullable=False)

    class_id = Column(Integer, nullable=False)

    # mean iou for mean_iou metric, might be different for another metric
    # null if metric is not applicable
    result = Column(Float, nullable=True)

    # json field with segmentation polygon
    predictions = Column(Text, nullable=False)

    # json field with segmentation polygon
    annotations = Column(Text, nullable=False)

    report = relationship('AccuracyReportModel', uselist=False,
                          backref=backref('semantic_segmentation_entities', cascade='delete'))

    @classmethod
    def query_api(cls) -> QueryApiModel:
        return QueryApiModel(
            query=cls.query,
            columns=cast(Dict[str, QueryableColumnLike], {
                'image_name': cls.image_name,
                'class_id': cls.class_id,
                'result': cls.result,
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
            result: float,
            predictions: str,
            annotations: str,
    ):
        self.report_id = report_id
        self.image_name = image_name
        self.class_id = class_id
        self.result = result
        self.predictions = predictions
        self.annotations = annotations

    def json(self) -> dict:
        # todo: use camelCase + adjust query strings mappings
        return {
            'id': self.id,
            'report_id': self.report_id,
            'image_name': self.image_name,
            'class_id': self.class_id,
            'result': self.result,
            'predictions': json.loads(self.predictions),
            'annotations': json.loads(self.annotations),
        }


class AggregatedSemanticSegmentationAccuracyReportQueryModel:

    @staticmethod
    def query_api() -> QueryApiModel:
        model_cls = SemanticSegmentationAccuracyReportEntityModel
        return QueryApiModel(
            query=(
                model_cls.query
                    .with_entities(
                    model_cls.image_name.label('image_name'),
                    func.avg(model_cls.result).label('average_result'),
                    func.array_agg(model_cls.class_id).label('class_ids'),
                )
                    .group_by(model_cls.image_name)
            ),
            columns={
                'image_name': model_cls.image_name,
                'class_id': model_cls.class_id,
                'average_result': func.avg(model_cls.result),
            },
            # query is a custom aggregated query - named tuple expected as a result
            to_json=AggregatedSemanticSegmentationAccuracyReportQueryModel.json,
            aggregated_columns={'average_result'}
        )

    class AggregatedQueryResult(NamedTuple):
        image_name: str
        class_ids: List[int]
        average_result: int

    @staticmethod
    def json(result: AggregatedQueryResult) -> dict:
        # todo: use camelCase + adjust query strings mappings
        return {
            'image_name': result.image_name,
            'class_ids': result.class_ids,
            'average_result': round(result.average_result, 2),
        }
