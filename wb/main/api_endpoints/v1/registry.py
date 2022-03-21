"""
 OpenVINO DL Workbench
 Endpoints to work with states and registry

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
import os
import shutil
import time
from contextlib import closing
from typing import List, Tuple

from flask import jsonify, request, current_app
from flask_sqlalchemy import SQLAlchemy

from config.constants import (ARTIFACTS_PATH, CLOUD_SERVICE_URL, MODEL_DOWNLOADS_FOLDER, PROFILING_ARTIFACTS_REPORT_DIR,
                              SHORT_TRANSFORMATIONS_CONFIGS, UPLOAD_FOLDER_DATASETS,
                              UPLOAD_FOLDER_MODELS,
                              DISABLE_JUPYTER, ENABLE_AUTH, JUPYTER_NOTEBOOKS_FOLDER, PYTHON_WRAPPER,
                              PRC_URL_TO_CHECK_CONNECTION, GENERAL_URL_TO_CHECK_CONNECTION, CLOUD_SHARED_FOLDER,
                              ENVIRONMENTS_FOLDER)
from wb.config.application import get_config
from wb.error.code_registry import CodeRegistry
from wb.extensions_factories.database import get_db_for_app
from wb.main.api_endpoints.v1 import V1_REGISTRY_API
from wb.main.api_endpoints.v1.cancel import cancel_artifacts_uploads
from wb.main.database import data_initialization
from wb.main.enabled_features_service import EnabledFeaturesService
from wb.main.enumerates import StatusEnum, DeploymentPackageSizesEnum, PipelineTypeEnum, TargetTypeEnum
from wb.main.models import (AccuracyJobsModel, ArtifactsModel, Int8CalibrationJobModel, JobsModel, PipelineModel,
                            TargetModel, CreateSetupBundleJobModel, UserMetadataModel, WBInfoModel,
                            WorkbenchSession, UNERASABLE_TABLES)
from wb.main.pipeline_creators.download_log_pipeline_creator import DownloadLogPipelineCreator
from wb.main.tasks.task import cancel_celery_task, wait_until_tasks_revoked
from wb.main.utils.dev_cloud_platforms import check_dev_cloud_service_with_devices
from wb.main.utils.safe_runner import safe_run
from wb.utils.utils import check_connection, is_dev_cloud_available, init_data_folders


@V1_REGISTRY_API.route('/sync', methods=['GET'])
@safe_run
def sync():
    running_jobs_types = (job_model.get_polymorphic_job_type() for job_model in (AccuracyJobsModel,
                                                                                 CreateSetupBundleJobModel,
                                                                                 Int8CalibrationJobModel))
    running_jobs_number = JobsModel.query.filter(
        JobsModel.job_type.in_(running_jobs_types),
        JobsModel.status.in_((StatusEnum.queued, StatusEnum.running))
    ).count()

    profiling_pipelines = get_running_profiling_pipelines()
    accuracy_pipelines = get_accuracy_pipelines()
    int8_calibration_pipelines = get_running_int8_calibration_pipelines()

    reject_unauthorized_sockets = not get_config().ssl_verify_enabled
    user_meta = UserMetadataModel.query.one()
    wb_info = WBInfoModel.query.one()
    url_to_check_connection = PRC_URL_TO_CHECK_CONNECTION if wb_info.is_prc else GENERAL_URL_TO_CHECK_CONNECTION
    is_dev_cloud_mode = bool(CLOUD_SERVICE_URL)

    if is_dev_cloud_mode:
        check_dev_cloud_service_with_devices()

    session = WorkbenchSession.query.first()

    response = jsonify({
        'time': time.time(),
        'version': wb_info.version,
        'codes': CodeRegistry.CODES,
        'taskIsRunning': bool(running_jobs_number + len([*profiling_pipelines, *int8_calibration_pipelines])),
        'runningProfilingPipelines': [pipeline.json() for pipeline in profiling_pipelines],
        'runningAccuracyPipelines': [pipeline.json() for pipeline in accuracy_pipelines],
        'runningInt8CalibrationPipelines': [pipeline.json() for pipeline in int8_calibration_pipelines],
        'predefinedTransformationsConfigs': SHORT_TRANSFORMATIONS_CONFIGS,
        'internetConnection': check_connection(url_to_check_connection),
        'packageSizes': DeploymentPackageSizesEnum.json(),
        'rejectUnauthorized': reject_unauthorized_sockets,
        'userMeta': user_meta.json(),
        'isDevCloudMode': is_dev_cloud_mode,
        'isDevCloudAvailable': is_dev_cloud_available(),
        'session': session.json() if is_dev_cloud_mode and session else None,
        'isJupyterAvailable': not DISABLE_JUPYTER,
        'isAuthEnabled': ENABLE_AUTH,
        'launchedViaWrapper': PYTHON_WRAPPER
    })
    return response


@V1_REGISTRY_API.route('/get-log', methods=['POST'])
@safe_run
def get_log():
    data = request.get_json() or {}
    local_target_model = TargetModel.query.filter_by(target_type=TargetTypeEnum.local).first()
    pipeline_creator = DownloadLogPipelineCreator(local_target_model.id, data.get('tabId'))
    pipeline_creator.create()
    pipeline_creator.run_pipeline()
    download_log_job = pipeline_creator.first_job
    return jsonify(download_log_job.json())


@V1_REGISTRY_API.route('/erase-all', methods=['DELETE'])
@safe_run
def erase_all():
    cancel_running_artifacts()
    cancel_running_jobs()
    clear_database()
    clear_paths()
    return jsonify({})


@V1_REGISTRY_API.route('/supported-preview-features', methods=['GET'])
@safe_run
def get_supported_preview_feature():
    return jsonify(EnabledFeaturesService().enabled_features)


def cancel_running_jobs():
    jobs = JobsModel.query.filter(JobsModel.status.in_((StatusEnum.running, StatusEnum.queued))).all()

    pipelines = set(job.pipeline for job in jobs if job.pipeline)
    pipeline_jobs = []
    for pipeline in pipelines:
        pipeline_jobs.extend(pipeline.jobs)

    tasks_ids = list(job.task_id for job in pipeline_jobs if job.task_id)
    cancel_celery_task(tasks=tasks_ids, force=True)
    wait_until_tasks_revoked(tasks_ids)


def cancel_running_artifacts():
    running_statuses = (StatusEnum.running, StatusEnum.queued)
    running_artifacts: List[ArtifactsModel] = ArtifactsModel.query.filter(ArtifactsModel.status.in_(running_statuses))
    running_artifact_ids = tuple(map(lambda artifact: artifact.id, running_artifacts))
    cancel_artifacts_uploads(artifacts_ids=running_artifact_ids, force=True)


def clear_database():
    truncate_data_in_db()
    data_initialization.initialize(current_app)


def truncate_data_in_db():
    database: SQLAlchemy = get_db_for_app()
    connection = database.engine.connect()
    with closing(connection):
        transition = connection.begin()
        sorted_tables = reversed(database.metadata.sorted_tables)
        for table in sorted_tables:
            if table.name in UNERASABLE_TABLES:
                continue
            connection.execute(table.delete())
        transition.commit()


def clear_paths():
    clear_assets_paths()
    init_data_folders()


def clear_assets_paths():
    assets_paths = (
        ARTIFACTS_PATH, MODEL_DOWNLOADS_FOLDER, PROFILING_ARTIFACTS_REPORT_DIR,
        UPLOAD_FOLDER_DATASETS, UPLOAD_FOLDER_MODELS, JUPYTER_NOTEBOOKS_FOLDER,
        ENVIRONMENTS_FOLDER, CLOUD_SHARED_FOLDER
    )
    for path in assets_paths:
        if not path or not os.path.exists(path):
            continue
        shutil.rmtree(path)


def get_running_int8_calibration_pipelines() -> List[PipelineModel]:
    int8_pipelines_types = (
        PipelineTypeEnum.local_int8_calibration,
        PipelineTypeEnum.remote_int8_calibration,
        PipelineTypeEnum.dev_cloud_int8_calibration
    )

    return get_running_pipelines_by_types(int8_pipelines_types)


def get_running_profiling_pipelines() -> List[PipelineModel]:
    profiling_pipeline_types = (
        PipelineTypeEnum.remote_profiling,
        PipelineTypeEnum.local_profiling,
        PipelineTypeEnum.dev_cloud_profiling
    )

    return get_running_pipelines_by_types(profiling_pipeline_types)


def get_accuracy_pipelines() -> List[PipelineModel]:
    accuracy_pipeline_types = (
        PipelineTypeEnum.local_accuracy,
        PipelineTypeEnum.remote_accuracy,
        PipelineTypeEnum.dev_cloud_accuracy,
        PipelineTypeEnum.local_per_tensor_report,
        PipelineTypeEnum.remote_per_tensor_report,
        PipelineTypeEnum.dev_cloud_per_tensor_report,
        PipelineTypeEnum.local_predictions_relative_accuracy_report,
        PipelineTypeEnum.remote_predictions_relative_accuracy_report,
        PipelineTypeEnum.dev_cloud_predictions_relative_accuracy_report,
    )

    return get_running_pipelines_by_types(accuracy_pipeline_types)


def get_running_pipelines_by_types(pipeline_types: Tuple[PipelineTypeEnum, ...]) -> List[PipelineModel]:
    pipelines: List[PipelineModel] = PipelineModel.query.filter(PipelineModel.type.in_(pipeline_types))
    return list(
        filter(
            lambda pipeline: pipeline.pipeline_status_name in (StatusEnum.queued, StatusEnum.running),
            pipelines
        )
    )
