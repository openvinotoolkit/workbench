"""
 OpenVINO DL Workbench
 AccuracyResultProcessor

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
from contextlib import closing
from pathlib import Path
from typing import Optional, List, Type, Union, Callable

import numpy as np
from openvino.tools.accuracy_checker.metrics.metric_profiler import ClassificationMetricProfiler, DetectionProfiler, \
    InstanceSegmentationProfiler, SegmentationMetricProfiler
from openvino.tools.accuracy_checker.metrics.metric_profiler.object_detection_metric_profiler import \
    DetectionListProfiler
from sqlalchemy.orm import Session

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import AccuracyReportTypeEnum
from wb.main.models import (AccuracyReportModel, BaseModel, ClassificationAccuracyReportEntityModel,
                            DetectionAccuracyReportEntityModel, SemanticSegmentationAccuracyReportEntityModel)
from wb.main.models.accuracy_analysis.instance_segmentation_accuracy_report_entity_model import \
    InstanceSegmentationAccuracyReportEntityModel
from wb.main.scripts.accuracy_tool.tool_output import AccuracyResult
from wb.main.shared.enumerates import TaskEnum


def convert_polygon(ac_polygons: List[List[List[int]]]) -> List[List[int]]:
    result = []
    for polygon in ac_polygons:
        result.append([coord for coords in polygon for coord in coords])
    return result


class InstanceSegmentationIdentifierProcessor:
    # used to map json report to processor
    report_types = {InstanceSegmentationProfiler.__provider__, }
    # used to map report model to report entity model table
    task_type = TaskEnum.instance_segmentation

    def __init__(self, report_id: int):
        self.report_id = report_id

    def process_identifier(self, identifier: dict) -> List[InstanceSegmentationAccuracyReportEntityModel]:
        entities: List[InstanceSegmentationAccuracyReportEntityModel] = []
        for class_id, per_class_result in identifier['per_class_result'].items():
            entity = self._process_per_class_result(identifier, class_id, per_class_result)
            entities.append(entity)
        return entities

    def _process_per_class_result(self, identifier: dict, class_id: int,
                                  per_class_result: dict) -> InstanceSegmentationAccuracyReportEntityModel:

        predictions = []
        for ac_prediction, score in zip(per_class_result['prediction_polygons'], per_class_result['prediction_scores']):
            predictions.append({'score': score, 'segmentation': convert_polygon(ac_prediction)})

        annotations = [{'segmentation': polygons} for polygons in per_class_result['annotation_polygons']]

        result = per_class_result.get('result') if isinstance(per_class_result.get('result'), (float, int)) else -1

        return InstanceSegmentationAccuracyReportEntityModel(
            report_id=self.report_id,
            image_name=identifier['identifier'],
            class_id=class_id,
            ap_precision=round(result, 2),
            annotations_count=len(annotations),
            annotations=json.dumps(annotations),
            predictions_count=len(predictions),
            predictions=json.dumps(predictions),
            matches=per_class_result['prediction_matches'],
        )


class SemanticSegmentationIdentifierProcessor:
    # used to map json report to processor
    report_types = {SegmentationMetricProfiler.__provider__, }
    # used to map report model to report entity model table
    task_type = TaskEnum.semantic_segmentation

    def __init__(self, report_id: int):
        self.report_id = report_id

    def process_identifier(self, identifier: dict) -> List[SemanticSegmentationAccuracyReportEntityModel]:
        entities: List[SemanticSegmentationAccuracyReportEntityModel] = []
        for class_id, per_class_result in identifier['per_class_result'].items():
            entity = self._process_per_class_result(identifier, class_id, per_class_result)
            entities.append(entity)

        return entities

    def _process_per_class_result(self, identifier: dict, class_id: int,
                                  per_class_result: dict) -> SemanticSegmentationAccuracyReportEntityModel:
        predictions = convert_polygon(per_class_result.get('prediction_mask', []))
        annotations = convert_polygon(per_class_result.get('annotation_mask', []))

        result = per_class_result.get('result')

        return SemanticSegmentationAccuracyReportEntityModel(
            report_id=self.report_id,
            image_name=identifier["identifier"],
            class_id=class_id,
            result=round(result, 2) if result is not None else result,
            predictions=json.dumps(predictions),
            annotations=json.dumps(annotations),
        )


class ODIdentifierProcessor:
    # used to map json report to processor
    report_types = {DetectionProfiler.__provider__, DetectionListProfiler.__provider__, }
    # used to map report model to report entity model table
    task_type = TaskEnum.object_detection

    def __init__(self, report_id: int):
        self.report_id = report_id

    def process_identifier(self, identifier: dict) -> List[DetectionAccuracyReportEntityModel]:
        entities: List[DetectionAccuracyReportEntityModel] = []
        for class_id, per_class_result in identifier['per_class_result'].items():
            entity = self._process_per_class_result(identifier, class_id, per_class_result)
            entities.append(entity)
        return entities

    def _process_per_class_result(self, identifier: dict, class_id: int,
                                  per_class_result: dict) -> DetectionAccuracyReportEntityModel:
        predictions = json.dumps([
            {'bbox': [round(coord, 2) for coord in bbox], 'score': round(score, 2)} for bbox, score in
            zip(per_class_result['prediction_boxes'], per_class_result['prediction_scores'])
        ])

        return DetectionAccuracyReportEntityModel(
            report_id=self.report_id,
            image_name=identifier['identifier'],
            class_id=class_id,
            precision=round(per_class_result['precision'], 2),
            # per_class_result['ap'] fails on mobilenet-ssd on voc dataset.
            # On 20th class in per class results there is no ap, so set default -1
            ap_precision=round(per_class_result.get('ap', -1), 2),
            annotations_count=per_class_result['num_annotation_boxes'],
            annotations=json.dumps(per_class_result['annotation_boxes']),
            predictions_count=per_class_result['num_prediction_boxes'],
            predictions=predictions,
            matches=per_class_result['prediction_matches'],
            total_predictions=identifier['num_prediction_boxes'],
        )


class ClassificationIdentifierProcessor:
    # used to map json report to processor
    report_types = {ClassificationMetricProfiler.__provider__, }
    # used to map report model to report entity model table
    task_type = TaskEnum.classification

    def __init__(self, report_id: int):
        self.report_id = report_id

    def process_identifier(self, identifier: dict) -> List[ClassificationAccuracyReportEntityModel]:
        prediction_scores = identifier['prediction_scores']
        annotation_class_id = identifier['annotation_label']

        # annotation_class_id can be out of range of prediction scores
        # for example emotions recognition model (5 classes) measured on imagenet dataset (1000 classes)
        if annotation_class_id < len(prediction_scores):
            annotation_score = prediction_scores[annotation_class_id]
            annotation_id_rank_in_predictions = sorted(prediction_scores, reverse=True).index(annotation_score)
        else:
            annotation_score = 0.0
            # convention to set -1 for not applicable cases
            annotation_id_rank_in_predictions = -1

        top_1_class_id = np.argmax(prediction_scores)
        top_1_class_id_confidence = prediction_scores[top_1_class_id]
        top_k_predictions = [
            {'category_id': label, 'score': prediction_scores[label]} for label in identifier['prediction_label']
        ]
        return [ClassificationAccuracyReportEntityModel(
            report_id=self.report_id,
            image_name=identifier['identifier'],
            annotation_class_id=annotation_class_id,
            confidence_in_annotation_class_id=round(annotation_score, 2),
            annotation_id_rank_in_predictions=annotation_id_rank_in_predictions,
            top_1_prediction=int(top_1_class_id),
            top_1_prediction_confidence=round(top_1_class_id_confidence, 2),
            top_k_predictions=json.dumps(top_k_predictions),
        )]


class AccuracyResultProcessor:
    """
    Process accuracy checker metric profiling file
    """
    FLUSH_INTERVAL = 50

    # pylint: disable=too-many-arguments
    def __init__(self,
                 report_type: AccuracyReportTypeEnum,
                 accuracy_report_dir: Path,
                 project_id: int,
                 target_dataset_id: int):
        self.report_type = report_type
        self.accuracy_report_dir = accuracy_report_dir
        self.project_id = project_id
        self.target_dataset_id = target_dataset_id

    def process_results(self, results: List[AccuracyResult]):
        session = get_db_session_for_celery()
        with closing(session):
            existing_reports: List[AccuracyReportModel] = (
                session.query(AccuracyReportModel)
                    .filter_by(report_type=self.report_type, project_id=self.project_id)
                    .all()
            )

            for existing_report in existing_reports:
                session.delete(existing_report)
            session.commit()

            for result in results:
                self.process_result(session, result)

    def process_result(self, session: Session, accuracy_result: AccuracyResult):
        report: AccuracyReportModel = self._create_report_record(accuracy_result)
        report.write_record(session)

        report_file: Optional[Path] = None
        if accuracy_result.report_file:
            report_file = self.accuracy_report_dir / accuracy_result.report_file

        if not report_file:
            return

        report_json = AccuracyResultProcessor._read_json(report_file)
        identifier_processor = self._get_identifier_processor(report_type=report_json['report_type'])

        if not identifier_processor:
            return

        report.task_type = identifier_processor.task_type
        report.write_record(session)

        try:
            process_fn = identifier_processor(report_id=report.id).process_identifier
            self._process_report(session, report_json, process_fn)
            session.commit()
        except Exception as exception:
            session.rollback()
            raise exception
        finally:
            report_file.unlink()

    def _process_report(self, session: Session, report: dict, process_identifier: Callable[[dict], List[BaseModel]]):
        for index, identifier in enumerate(report['report']):
            models: List[BaseModel] = process_identifier(identifier)
            if models:
                session.add_all(models)
            if index % self.FLUSH_INTERVAL == 0:
                session.flush()

    def _get_identifier_processor(self, report_type: str) -> Type[Union[
        ClassificationIdentifierProcessor,
        ODIdentifierProcessor,
        SemanticSegmentationIdentifierProcessor,
        InstanceSegmentationIdentifierProcessor
    ]]:
        processors = [
            ClassificationIdentifierProcessor,
            ODIdentifierProcessor,
            SemanticSegmentationIdentifierProcessor,
            InstanceSegmentationIdentifierProcessor,
        ]

        for processor in processors:
            if report_type in processor.report_types:
                return processor

        raise RuntimeError(f'Report type {report_type} is not supported')

    def _create_report_record(self, accuracy_result: AccuracyResult) -> AccuracyReportModel:
        report = AccuracyReportModel(
            project_id=self.project_id,
            report_type=self.report_type,
            metric_type=accuracy_result.metric,
            metric_name=accuracy_result.metric_name,
            accuracy_result=accuracy_result.result,
            accuracy_postfix=accuracy_result.postfix,
            target_dataset_id=self.target_dataset_id,
        )
        return report

    @staticmethod
    def _read_json(path: Path) -> dict:
        # in case of performance issues consider using stream reading of json (ijson package)
        with path.open() as report_file:
            return json.load(report_file)
