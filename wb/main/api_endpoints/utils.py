"""
 OpenVINO DL Workbench
 Endpoints utility functions

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
import hashlib
import json
import os
from typing import List, Tuple

from flask import Request
from sqlalchemy import desc

from wb.error.general_error import GeneralError
from wb.error.inconsistent_upload_error import InconsistentModelConfigurationError, FileChunkUploadError
from wb.error.request_error import InternalServerRequestError
from wb.extensions_factories.database import get_db_session_for_app
from wb.main.accuracy_utils.yml_abstractions.typed_parameter import Postprocessing, Preprocessing, Metric
from wb.main.enumerates import (StatusEnum, STATUS_PRIORITY, TaskMethodEnum, OptimizationTypesEnum, JobTypesEnum)
from wb.main.forms.model_optimizer import MOForm
from wb.main.jobs.utils.database_functions import set_status_in_db
from wb.main.models import (AccuracyJobsModel, ArtifactsModel, ProfilingJobModel,
                            DatasetsModel, DevicesModel, FilesModel, Int8CalibrationJobModel,
                            OMZModelConvertJobModel, ModelOptimizerJobModel,
                            ModelOptimizerScanJobModel, ProjectsModel, SingleInferenceInfoModel, TopologiesModel,
                            TopologyAnalysisJobsModel)
from wb.main.shared.enumerates import TaskEnum, DatasetTypesEnum
from wb.main.utils.utils import remove_dir, get_size_of_files, chmod_dir_recursively


def load_profiling_job(job_id: int, inference_result_ids: tuple = None) -> dict:
    job_record = ProfilingJobModel.query.get(job_id)
    if not job_record:
        raise AssertionError('Cannot find information about job {}'.format(job_id))
    config = job_record.json()
    results, status = collect_profiling_results_and_status(job_id, inference_result_ids)
    return {
        'jobType': JobTypesEnum.profiling_type.value,
        'jobId': job_id,
        'status': status.value,
        'creationTimestamp': job_record.creation_timestamp.timestamp(),
        'config': config,
        'result': results,
    }


def collect_profiling_results_and_status(job_id: int, inference_result_ids: tuple = None) -> Tuple[list, StatusEnum]:
    if inference_result_ids is not None:
        result_records = SingleInferenceInfoModel.query.filter(
            SingleInferenceInfoModel.job_id.in_(inference_result_ids)).all()
    else:
        result_records = SingleInferenceInfoModel.query.filter_by(job_id=job_id).all()

    results = []
    current_status = StatusEnum.ready

    for result in result_records:
        results.append(result.json())
        if STATUS_PRIORITY[result.status] > STATUS_PRIORITY[current_status]:
            current_status = result.status
    return results, current_status


def load_int8_job_from_database(job_id):
    job_record = Int8CalibrationJobModel.query.filter_by(job_id=job_id).first()
    if not job_record:
        raise ValueError
    data = {
        'jobType': JobTypesEnum.int8calibration_type.value,
        'jobId': job_id,
        'status': job_record.status.value,
        'creationTimestamp': job_record.creation_timestamp.timestamp(),
        'config': job_record.json()
    }
    return data


def write_chunk(upload_id: int, request: Request):
    file_record: FilesModel = FilesModel.query.get(upload_id)
    chunk = request.files['file'].stream.read()
    os.makedirs(os.path.dirname(file_record.path), exist_ok=True)

    with open(file_record.path, 'ab') as file:
        file.write(chunk)

    if file_record.uploaded_blob_size:
        file_record.uploaded_blob_size += len(chunk)
    else:
        file_record.uploaded_blob_size = len(chunk)
    file_record.progress = file_record.uploaded_blob_size / file_record.size * 100
    if file_record.progress == 100:
        file_record.status = StatusEnum.ready
    file_record.write_record(get_db_session_for_app())


def on_new_chunk_received(request: Request, file_id: int):
    file_record: FilesModel = FilesModel.query.get(file_id)
    artifact: ArtifactsModel = file_record.artifact

    if not artifact or artifact.status == StatusEnum.cancelled or file_record.status == StatusEnum.cancelled:
        return {}
    try:
        write_chunk(file_id, request)
    except OSError:
        raise InternalServerRequestError()
    return {}


def save_artifact_chunk_upload(request: Request, file_id: int):
    file_record: FilesModel = FilesModel.query.get(file_id)
    artifact: ArtifactsModel = file_record.artifact

    if not artifact or artifact.status == StatusEnum.cancelled or file_record.status == StatusEnum.cancelled:
        return
    try:
        write_chunk(file_id, request)
    except OSError:
        raise FileChunkUploadError('Error writing artifact file chunk')
    if artifact.is_all_files_uploaded:
        set_status_in_db(FilesModel, file_record.id, StatusEnum.ready, get_db_session_for_app())
        chmod_dir_recursively(os.path.dirname(artifact.path))
        artifact.size = get_size_of_files(artifact.path)
        artifact.status = StatusEnum.ready
        artifact.write_record(get_db_session_for_app())


def is_descendant_of(target_model_id: int, model_id: int) -> bool:
    model = TopologiesModel.query.get(model_id)
    if not model.optimized_from:
        return False
    if model.optimized_from == target_model_id:
        return True
    return is_descendant_of(target_model_id, model.optimized_from)


def get_job_json(job_id) -> dict:
    loaders = (load_profiling_job, load_int8_job_from_database)
    for loader in loaders:
        try:
            return loader(job_id)
        except ValueError:
            pass
    raise GeneralError


def delete_model_from_db(model_id: int):
    model = TopologiesModel.query.get(model_id)
    if model:
        model.delete_record(get_db_session_for_app())


def delete_dataset_from_db(dataset_id: int):
    for records in dataset_related_information(dataset_id):
        DatasetsModel.delete_records(records, get_db_session_for_app())

    dataset = DatasetsModel.query.get(dataset_id)

    if dataset:
        dataset_path = dataset.path
        dataset.delete_record(get_db_session_for_app())
        remove_dir(dataset_path)


def dataset_related_information(dataset_id: int):
    projects = ProjectsModel.query.filter_by(dataset_id=dataset_id).all()
    all_project_ids = [p.id for p in projects]

    run_results, compound_configs = projects_related_information(all_project_ids)

    all_accuracy_results = (
        AccuracyJobsModel.query
            .filter(AccuracyJobsModel.project_id.in_(all_project_ids))
            .all()
    )
    all_int8_results = (
        Int8CalibrationJobModel.query
            .filter(Int8CalibrationJobModel.project_id.in_(all_project_ids))
            .all()
    )

    return run_results, compound_configs, all_int8_results, all_accuracy_results, projects


def projects_related_information(project_ids: List[int]) -> tuple:
    compound_configs = (
        ProfilingJobModel.query
            .filter(ProfilingJobModel.project_id.in_(project_ids))
            .all()
    )

    all_infer_config_ids = [i.job_id for i in compound_configs]

    inference_results = (
        SingleInferenceInfoModel.query
            .filter(SingleInferenceInfoModel.profiling_job_id.in_(all_infer_config_ids))
            .all()
    )

    return inference_results, compound_configs


def find_projects(model_id: int, all_levels: bool) -> tuple:
    if model_id:
        derived_models_id = []
        if all_levels:
            derived_models_id = [m.id for m in TopologiesModel.query.all() if is_descendant_of(model_id, m.id)]
        projects = ProjectsModel.query.filter(ProjectsModel.model_id.in_([*derived_models_id, model_id])).all()
        return filter_projects(projects)
    if all_levels:
        all_models_ids = [model.id for model in TopologiesModel.query.all()]
        projects = ProjectsModel.query.filter(ProjectsModel.model_id.in_(all_models_ids)).all()
    else:
        all_original_models = TopologiesModel.query.filter(TopologiesModel.optimized_from.is_(None)).all()
        all_original_models_ids = [m.id for m in all_original_models]
        projects = ProjectsModel.query.filter(ProjectsModel.model_id.in_(all_original_models_ids)).all()

    return filter_projects(projects)


def filter_projects(projects: List[ProjectsModel]):
    projects_ids = [project.id for project in projects]
    int_8_failed = (
        Int8CalibrationJobModel.query
            .filter(Int8CalibrationJobModel.project_id.in_(projects_ids))
            .filter(Int8CalibrationJobModel.status.in_([StatusEnum.cancelled]))
            .all()
    )
    failed_int8_projects_ids = []
    for failed_int8_job in int_8_failed:
        int8_failed_project = find_project_by(failed_int8_job.result_model_id)
        if int8_failed_project:
            failed_int8_projects_ids.append(int8_failed_project.id)

    projects_ids_with_failed_models = [project.id for project in projects if
                                       project.topology.status in (StatusEnum.cancelled, StatusEnum.error)]

    return tuple(p for p in projects if p.id not in [*failed_int8_projects_ids, *projects_ids_with_failed_models])


def find_project_by(model_id):
    resulting_model = TopologiesModel.query.get(model_id)
    return ProjectsModel.query.filter_by(model_id=resulting_model.id).first()


def project_json(project: ProjectsModel) -> dict:
    optimization_params = {}
    if project.optimization_type == OptimizationTypesEnum.int8calibration:
        int8_job = Int8CalibrationJobModel.query.filter_by(result_model_id=project.model_id).first()
        if int8_job.threshold:
            optimization_params['threshold'] = int8_job.threshold
        optimization_params['subsetSize'] = int8_job.subset_size
        optimization_params['calibrationDatasetName'] = int8_job.dataset.name

        optimization_params['algorithm'] = int8_job.algorithm.value
        optimization_params['preset'] = int8_job.preset.value
    project_info = project.json()
    del project_info['optimizationType']
    return {
        **project_info,
        'configParameters': {
            'optimizationType': project.optimization_type.value,
            **optimization_params
        },
        'analysisData': None,
        'execInfo': None,
        'parentId': None,
        'isAccuracyAvailable': project.dataset.dataset_type != DatasetTypesEnum.not_annotated,
    }


def fill_with_exec_info(result):
    for info in result:
        jobs = ProfilingJobModel.query.filter_by(project_id=info['id'])
        job_ids = [job.job_id for job in jobs]
        best_infer_results: SingleInferenceInfoModel = (
            SingleInferenceInfoModel.query
                .filter(SingleInferenceInfoModel.profiling_job_id.in_(job_ids),
                        SingleInferenceInfoModel.throughput.isnot(None))
                .order_by(SingleInferenceInfoModel.throughput.desc())
                .first()
        )
        if best_infer_results:
            info['execInfo'] = best_infer_results.json()['execInfo']
            info['runtimePrecisions'] = best_infer_results.get_inference_runtime_precisions()
        else:
            info['execInfo'] = {
                'throughput': None,
                'latency': None,
                'batch': None,
                'nireq': None,
            }
            info['runtimePrecisions'] = None


def fill_with_analysis_data(result):
    for info in result:
        model_id = info['modelId']
        data = TopologyAnalysisJobsModel.query.filter_by(model_id=model_id).first()
        if data:
            info['analysisData'] = data.json()


def fill_projects_with_model_and_dataset_names(projects: list):
    for project in projects:
        project_record = ProjectsModel.query.get(project['id'])
        original_model_id = project_record.get_top_level_model_id()
        model = TopologiesModel.query.get(original_model_id)
        if model:
            project['modelName'] = model.name
        dataset_id = project['datasetId']
        dataset = DatasetsModel.query.get(dataset_id)
        if dataset:
            project['datasetName'] = dataset.name
        device_id = project['deviceId']
        device = DevicesModel.query.get(device_id)
        if device:
            project['deviceType'] = device.type
            project['deviceName'] = device.device_name


# pylint: disable=fixme
# TODO Move to project model json method
def connect_with_parents(projects: List[dict]):
    for project in projects:
        project_id: int = project['id']
        project_model: ProjectsModel = ProjectsModel.query.get(project_id)
        parent_project_model = project_model.get_parent_project()
        if parent_project_model:
            project['parentId'] = parent_project_model.id


def try_load_configuration(config: dict):
    try:
        if not TaskEnum.has_value(config['taskType']):
            raise InconsistentModelConfigurationError('Incorrect task type value: {}'.format(config['taskType']))
        if not TaskMethodEnum.has_value(config['taskMethod'].lower()):
            raise InconsistentModelConfigurationError('Incorrect task method value: {}'.format(config['taskMethod']))
        Postprocessing.from_list(config['postprocessing'])
        Preprocessing.from_list(config['preprocessing'])
        Metric.from_list(config['metric'])
    except KeyError as err:
        raise InconsistentModelConfigurationError('Configuration does not contain required field "{}"'.format(err))
    except Exception as exc:
        raise InconsistentModelConfigurationError('Incorrect configuration data', str(exc))


def md5(file_name: str) -> str:
    hash_md5 = hashlib.md5()  # nosec: blacklist
    with open(file_name, 'rb') as current_file:
        for chunk in iter(lambda: current_file.read(4096), b''):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def get_result_model_path_for_job(job: int) -> str:
    return job.result_model.path if isinstance(job, Int8CalibrationJobModel) else None


def get_results_model_paths_for_jobs(jobs: list) -> list:
    paths = []
    for job in jobs:
        path = get_result_model_path_for_job(job)
        if path:
            paths.append(path)
    return paths


def fill_model_job_details(model, model_dict: dict):
    last_mo_job_record = (
        ModelOptimizerJobModel.query
            .filter_by(result_model_id=model.id)
            .order_by(desc(ModelOptimizerJobModel.creation_timestamp))
            .first()
    )
    last_conversion_job = (
        OMZModelConvertJobModel.query
            .filter_by(result_model_id=model.id)
            .order_by(desc(OMZModelConvertJobModel.creation_timestamp))
            .first()
    )
    mo_analyzed_job = (
        ModelOptimizerScanJobModel.query
            .filter_by(topology_id=model.converted_from)
            .first()
    )
    # Erroneous models should be shown only if they failed in Model Optimizer.
    if (model.status == StatusEnum.error
            and (not last_mo_job_record or last_mo_job_record.status != StatusEnum.error)):
        return
    if last_mo_job_record:
        model_dict['mo'] = {}
        if last_mo_job_record.mo_args:
            model_dict['mo']['params'] = MOForm.to_params(json.loads(last_mo_job_record.mo_args))
        model_dict['mo']['errorMessage'] = last_mo_job_record.detailed_error_message
    if last_conversion_job:
        model_dict['mo'] = {}
        if last_conversion_job.conversion_args:
            model_dict['mo']['params'] = {}
            model_dict['mo']['params']['dataType'] = json.loads(last_conversion_job.conversion_args)['precision']
    if mo_analyzed_job and mo_analyzed_job.information:
        model_dict['mo']['analyzedParams'] = mo_analyzed_job.short_json()['information']
