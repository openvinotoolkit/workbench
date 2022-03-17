"""
 OpenVINO DL Workbench
 Accuracy report http api handlers

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
import math
from typing import List, Optional, Union, Tuple, Any

from sqlalchemy import desc
from werkzeug.datastructures import ImmutableMultiDict

from config.constants import CLOUD_SERVICE_URL
from wb.error.dev_cloud_errors import DevCloudGeneralError
from wb.error.request_error import BadRequestError, NotFoundRequestError
from wb.main.accuracy_report.query_string_parameters_parser import parse_query_string_parameters, \
    QueryApiModel
from wb.main.enumerates import AccuracyReportTypeEnum, TargetTypeEnum
from wb.main.models import (ProjectsModel, TopologyAnalysisJobsModel, AccuracyReportModel, PipelineModel,
                            ClassificationAccuracyReportEntityModel,
                            TensorDistanceAccuracyReportEntityModel,
                            DetectionAccuracyReportEntityModel, AggregatedDetectionAccuracyReportQueryModel,
                            SemanticSegmentationAccuracyReportEntityModel,
                            AggregatedInstanceSegmentationAccuracyReportQueryModel,
                            InstanceSegmentationAccuracyReportEntityModel,
                            AggregatedSemanticSegmentationAccuracyReportQueryModel)
from wb.main.pipeline_creators.accuracy_analysis.dev_cloud_accuracy_pipeline_creator import \
    DevCloudAccuracyPipelineCreator
from wb.main.pipeline_creators.accuracy_analysis.dev_cloud_per_tensor_report_pipeline_creator import \
    DevCloudPerTensorReportPipelineCreator
from wb.main.pipeline_creators.accuracy_analysis.dev_cloud_predictions_relative_accuracy_report_pipeline_creator import \
    DevCloudPredictionsRelativeAccuracyReportPipelineCreator
from wb.main.pipeline_creators.accuracy_analysis.local_accuracy_pipeline_creator import LocalAccuracyPipelineCreator
from wb.main.pipeline_creators.accuracy_analysis.local_per_tensor_report_pipeline_creator import \
    LocalPerTensorReportPipelineCreator
from wb.main.pipeline_creators.accuracy_analysis.local_predictions_relative_accuracy_report_pipeline_creator import \
    LocalPredictionsRelativeAccuracyReportPipelineCreator
from wb.main.pipeline_creators.accuracy_analysis.remote_accuracy_pipeline_creator import RemoteAccuracyPipelineCreator
from wb.main.pipeline_creators.accuracy_analysis.remote_per_tensor_report_pipeline_creator import \
    RemotePerTensorReportPipelineCreator
from wb.main.pipeline_creators.accuracy_analysis.remote_predictions_relative_accuracy_report_pipeline_creator import \
    RemotePredictionsRelativeAccuracyReportPipelineCreator
from wb.main.shared.enumerates import TaskEnum
from wb.main.utils.utils import to_snake_case


def get_reports(project_id: int) -> List[dict]:
    project: ProjectsModel = ProjectsModel.query.get(project_id)

    if not project:
        raise NotFoundRequestError('Project not found')

    reports = AccuracyReportModel.query.filter_by(project_id=project.id).all()

    return [report.json() for report in reports]


def _get_report_entities_query_api(report_id: int, query_string: ImmutableMultiDict) -> Tuple[
    QueryApiModel, ImmutableMultiDict, Any]:
    report: AccuracyReportModel = AccuracyReportModel.query.get(report_id)
    if not report:
        raise NotFoundRequestError('Report not found')

    with_error_filter_fn = None

    query_api: Optional[QueryApiModel] = None
    if report.report_type == AccuracyReportTypeEnum.parent_model_per_tensor:
        query_api = TensorDistanceAccuracyReportEntityModel.query_api()
    elif report.task_type == TaskEnum.object_detection:
        query_string = query_string.copy()
        aggregate = query_string.pop('aggregate', 'false') == 'true'
        if not aggregate:
            query_api = DetectionAccuracyReportEntityModel.query_api()
        else:
            query_api = AggregatedDetectionAccuracyReportQueryModel.query_api()
    elif report.task_type == TaskEnum.semantic_segmentation:
        query_string = query_string.copy()
        aggregate = query_string.pop('aggregate', 'false') == 'true'
        if not aggregate:
            query_api = SemanticSegmentationAccuracyReportEntityModel.query_api()
        else:
            query_api = AggregatedSemanticSegmentationAccuracyReportQueryModel.query_api()
    elif report.task_type == TaskEnum.instance_segmentation:
        query_string = query_string.copy()
        aggregate = query_string.pop('aggregate', 'false') == 'true'
        if not aggregate:
            query_api = InstanceSegmentationAccuracyReportEntityModel.query_api()
        else:
            query_api = AggregatedInstanceSegmentationAccuracyReportQueryModel.query_api()
    elif report.task_type == TaskEnum.classification:
        query_api = ClassificationAccuracyReportEntityModel.query_api()
        query_string = query_string.copy()
        with_error = query_string.pop('with_error', 'false') == 'true'
        if with_error:
            with_error_filter_fn = ClassificationAccuracyReportEntityModel.annotation_class_id \
                                   != ClassificationAccuracyReportEntityModel.top_1_prediction

    if not query_api:
        raise BadRequestError('Report type not supported')

    return query_api, query_string, with_error_filter_fn


def query_report_entities(report_id: int, query_string: ImmutableMultiDict) -> Union[dict, list]:
    query_api, query_string, with_error_filter_fn = _get_report_entities_query_api(report_id, query_string)

    filter_fns, having_fns, order_by_fn, page, size, count = parse_query_string_parameters(
        query_api, query_string
    )

    query = query_api.query.filter_by(report_id=report_id)

    if with_error_filter_fn is not None:
        query = query.filter(with_error_filter_fn)

    if filter_fns:
        query = query.filter(*filter_fns)

    if having_fns:
        for having_fn in having_fns:
            query = query.having(having_fn)

    if order_by_fn is not None:
        query = query.order_by(order_by_fn)

    entities_query = (
        query
            .order_by(desc(query_api.columns.get('image_name')))
            .offset(page * size)
            .limit(size)
    )

    entities_json = [query_api.to_json(entity) for entity in entities_query.all()]

    if not count:
        return entities_json

    entities_count = query.count()

    return {
        'entities': entities_json,
        'total': entities_count,
        'total_pages': math.ceil(entities_count / size)
    }


def get_dataset_annotation_accuracy_report_pipeline_creator(project: ProjectsModel) -> \
        Union[LocalAccuracyPipelineCreator, RemoteAccuracyPipelineCreator, DevCloudAccuracyPipelineCreator]:
    target = project.target
    if CLOUD_SERVICE_URL and target.target_type != TargetTypeEnum.dev_cloud:
        raise DevCloudGeneralError('Accuracy measurement is not supported in DevCloud')
    if target.target_type == TargetTypeEnum.local:
        return LocalAccuracyPipelineCreator(project_id=project.id)
    if target.target_type == TargetTypeEnum.dev_cloud:
        return DevCloudAccuracyPipelineCreator(project_id=project.id, target_id=target.id)

    return RemoteAccuracyPipelineCreator(project_id=project.id, target_id=target.id)


def get_per_tensor_accuracy_report_pipeline_creator(project: ProjectsModel) -> \
        Union[LocalPerTensorReportPipelineCreator,
              RemotePerTensorReportPipelineCreator,
              DevCloudPerTensorReportPipelineCreator]:
    target = project.target
    if target.target_type == TargetTypeEnum.local:
        return LocalPerTensorReportPipelineCreator(project_id=project.id)
    if target.target_type == TargetTypeEnum.remote:
        return RemotePerTensorReportPipelineCreator(project_id=project.id, target_id=target.id)
    if target.target_type == TargetTypeEnum.dev_cloud:
        return DevCloudPerTensorReportPipelineCreator(project_id=project.id, target_id=target.id)
    raise AssertionError(f'PerTensor Accuracy report is not supported for {target.target_type}')


def get_predictions_relative_accuracy_report_pipeline_creator(project: ProjectsModel) -> \
        Union[LocalPredictionsRelativeAccuracyReportPipelineCreator,
              RemotePredictionsRelativeAccuracyReportPipelineCreator,
              DevCloudPredictionsRelativeAccuracyReportPipelineCreator]:
    target = project.target
    if target.target_type == TargetTypeEnum.local:
        return LocalPredictionsRelativeAccuracyReportPipelineCreator(project_id=project.id)
    if target.target_type == TargetTypeEnum.remote:
        return RemotePredictionsRelativeAccuracyReportPipelineCreator(project_id=project.id, target_id=target.id)
    if target.target_type == TargetTypeEnum.dev_cloud:
        return DevCloudPredictionsRelativeAccuracyReportPipelineCreator(project_id=project.id, target_id=target.id)
    raise AssertionError(f'Relative Accuracy report is not supported for {target.target_type}')


def get_pipeline_creator_for_relative_report(project, report_type, report_type_enum) \
        -> Union[LocalPerTensorReportPipelineCreator, RemotePerTensorReportPipelineCreator,
                 LocalPredictionsRelativeAccuracyReportPipelineCreator]:
    project_topology = project.topology
    topology_analysis_job: TopologyAnalysisJobsModel = project_topology.analysis_job
    if not topology_analysis_job:
        raise BadRequestError('Project model was not analyzed')
    is_int8_model = topology_analysis_job.is_int8
    if not is_int8_model:
        raise BadRequestError(f'Accuracy report type {report_type} is available only for INT8 models')
    parent_topology = project_topology.optimized_from_record
    if not parent_topology:
        raise BadRequestError(
            f'Accuracy report type {report_type} is available only for models, optimized in DL Workbench')
    if report_type_enum == AccuracyReportTypeEnum.parent_model_per_tensor:
        if len(json.loads(topology_analysis_job.inputs)) > 1:
            raise BadRequestError('Per-tensor analysis is not supported for multi-input topologies')
        pipeline_creator = get_per_tensor_accuracy_report_pipeline_creator(project)
    elif report_type_enum == AccuracyReportTypeEnum.parent_model_predictions:
        pipeline_creator = get_predictions_relative_accuracy_report_pipeline_creator(project)
    else:
        raise BadRequestError('Bad report type')
    return pipeline_creator


def create_report(project_id: int, report_type: Optional[str]) -> PipelineModel:
    if not report_type:
        raise BadRequestError('No report type provided')
    try:
        report_type_enum = AccuracyReportTypeEnum(to_snake_case(report_type))
    except ValueError:
        raise BadRequestError('Bad report type')
    project: ProjectsModel = ProjectsModel.query.get(project_id)
    if not project:
        raise NotFoundRequestError(f'Project with id {project_id} was not found')
    if report_type_enum == AccuracyReportTypeEnum.dataset_annotations:
        pipeline_creator = get_dataset_annotation_accuracy_report_pipeline_creator(project=project)
    else:
        pipeline_creator = get_pipeline_creator_for_relative_report(project, report_type, report_type_enum)
    pipeline = pipeline_creator.create()
    pipeline_creator.run_pipeline()
    return pipeline
