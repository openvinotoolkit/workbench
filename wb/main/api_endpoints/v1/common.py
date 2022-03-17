"""
 OpenVINO DL Workbench
 Common Endpoints

 Copyright (c) 2018 Intel Corporation

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

from flask import jsonify, request

from wb.extensions_factories.database import get_db_session_for_app
from wb.main.api_endpoints.utils import (get_job_json, find_projects, project_json, fill_with_exec_info,
                                         connect_with_parents, load_profiling_job, fill_with_analysis_data,
                                         fill_projects_with_model_and_dataset_names)
from wb.main.api_endpoints.v1 import V1_COMMON_API
from wb.main.api_endpoints.v1.cancel import cancel_artifacts_uploads, cancel_pipeline
from wb.main.enumerates import StatusEnum, AccuracyReportTypeEnum
from wb.main.models import ProjectsModel, SingleInferenceInfoModel, UserMetadataModel, PipelineModel, \
    AccuracyReportModel
from wb.main.tasks.task import cancel_celery_task
from wb.main.utils.safe_runner import safe_run


@V1_COMMON_API.route('/job/<int:job_id>', methods=['GET'])
@safe_run
def get_job_info(job_id: int):
    inference_result_id = request.args.get('inferenceResultId', type=int)
    if inference_result_id:
        job_data = load_profiling_job(job_id, (inference_result_id,))
        job_data['result'] = job_data['result'][0]
    else:
        job_data = get_job_json(job_id)
    return jsonify(job_data) if job_data else ('No such job: {}'.format(job_id), 404)


@V1_COMMON_API.route('/user-info', methods=['POST'])
@safe_run
def set_info():
    user_info = request.get_json()
    user_meta = UserMetadataModel.query.one()
    if user_meta:
        user_meta.viewed_warning = user_info['viewedWarning']
        user_meta.agreed_cookies = user_info['agreedCookies']
        user_meta.write_record(get_db_session_for_app())
    return jsonify(user_meta.json())


@V1_COMMON_API.route('/exec-graph/<int:single_profiling_result_id>', methods=['GET'])
@safe_run
def get_exec_graph_for_job(single_profiling_result_id: int):
    single_profiling_result = SingleInferenceInfoModel.query.get(single_profiling_result_id)
    if not single_profiling_result:
        return 'Cannot find Inference results for id {}'.format(single_profiling_result_id), 404
    return jsonify({'execGraph': single_profiling_result.exec_graph})


@V1_COMMON_API.route('/projects-info/', methods=['GET'])
@safe_run
def projects_info():
    include_exec_info = bool(request.args.get('includeExecInfo'))
    defined_model_id = request.args.get('modelId')
    if defined_model_id:
        defined_model_id = int(defined_model_id)
    all_levels = bool(request.args.get('allLevels'))
    projects = find_projects(defined_model_id, all_levels)
    result = [project_json(project) for project in projects]
    if include_exec_info:
        fill_with_exec_info(result)
        for res in result:
            accuracy_report: AccuracyReportModel = (
                AccuracyReportModel
                    .query
                    .filter_by(project_id=res['id'], report_type=AccuracyReportTypeEnum.dataset_annotations)
                    .order_by(AccuracyReportModel.accuracy_result.desc())
                    .first()
            )
            res['execInfo']['accuracy'] = accuracy_report.accuracy_result if accuracy_report else None
    fill_with_analysis_data(result)
    connect_with_parents(result)
    fill_projects_with_model_and_dataset_names(result)
    return jsonify(result)


@V1_COMMON_API.route('/project-info/<int:project_id>', methods=['GET'])
@safe_run
def project_info(project_id: int):
    project = ProjectsModel.query.get(project_id)
    if not project:
        return 'Project with id {} was not found on database'.format(project_id), 404
    return jsonify(project.json())


@V1_COMMON_API.route('/delete-project/<int:project_id>', methods=['DELETE'])
@safe_run
def delete_project(project_id: int):
    requested_project: ProjectsModel = ProjectsModel.query.get(project_id)
    if not requested_project:
        return f'Project with id {project_id} was not found', 404

    projects_to_delete = [requested_project]

    derived_projects = requested_project.derived_projects

    if derived_projects:
        projects_to_delete = derived_projects + projects_to_delete

    for project in projects_to_delete:
        project_has_running_jobs = bool(project.jobs) and any(
            [job.status in (StatusEnum.queued, StatusEnum.running) for job in project.jobs])
        if project_has_running_jobs or project.last_pipeline.pipeline_status_name == StatusEnum.running:
            return f'Unable to delete project with id {project_id} - there are running jobs for this project', 400
        tasks_id_to_cancel = [job.task_id for job in project.jobs if job.task_id]
        cancel_celery_task(tasks=tasks_id_to_cancel)
        project.delete_record(get_db_session_for_app())

    return jsonify({'id': project_id})


@V1_COMMON_API.route('/unload', methods=['POST'])
@safe_run
def cancel_uploads():
    data = json.loads(request.data)
    cancel_artifacts_uploads([*data['datasetIds'], *data['modelIds'], *data['tokenizerIds']])

    pipeline_ids = data['pipelineIds']
    if pipeline_ids:
        for pipeline_id in pipeline_ids:
            pipeline: PipelineModel = PipelineModel.query.get(pipeline_id)
            cancel_pipeline(pipeline)

    return jsonify({'status': 'ok'})
