"""
 OpenVINO DL Workbench
 Endpoints to work with downloading of files

 Copyright (c) 2018 Intel Corporation

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
from contextlib import closing

from flask import jsonify, request, send_file

from config.constants import LOG_FILE
from wb.extensions_factories.database import get_db_session_for_app
from wb.main.api_endpoints.v1 import V1_DOWNLOAD_API, V1_EXPORT_PROJECT_API
from wb.main.api_endpoints.utils import md5
from wb.main.models.download_configs_model import ModelDownloadConfigsModel
from wb.main.models.downloadable_artifacts_model import DownloadableArtifactsModel
from wb.main.enumerates import TargetTypeEnum
from wb.main.models.target_model import TargetModel
from wb.main.pipeline_creators.download_model_pipeline_creator import DownloadModelPipelineCreator
from wb.main.pipeline_creators.export_project_pipeline_creator import ExportProjectPipelineCreator
from wb.main.pipeline_creators.inference_report_export_pipeline_creator import InferenceReportExportPipelineCreator
from wb.main.pipeline_creators.project_report_export_pipeline_creator import ProjectReportExportPipelineCreator
from wb.main.utils.safe_runner import safe_run


@V1_DOWNLOAD_API.route('/model-archive/<int:model_id>')
@safe_run
def archive_model(model_id: int):
    download_job: ModelDownloadConfigsModel = ModelDownloadConfigsModel.query.filter_by(model_id=model_id).first()
    if download_job:
        downloadable_artifact = download_job.downloadable_artifact
        exist, _ = downloadable_artifact.archive_exists()
        if exist:
            return jsonify({
                'jobId': None,
                'message': 'archive already exists',
                'artifactId': downloadable_artifact.id
            })
        with closing(get_db_session_for_app()) as session:
            downloadable_artifact.delete_record(session)
            download_job.delete_record(session)
    tab_id = request.args.get('tabId')
    name = request.args.get('name')
    local_target_model = TargetModel.query.filter_by(target_type=TargetTypeEnum.local).first()
    pipeline_creator = DownloadModelPipelineCreator(local_target_model.id, tab_id, model_id, name)
    pipeline_creator.create()
    pipeline_creator.run_pipeline()
    download_model_job = pipeline_creator.first_job
    return jsonify(download_model_job.json())


@V1_DOWNLOAD_API.route('/check-sum/<int:model_id>')
@safe_run
def check_sum(model_id: int):
    download_job = ModelDownloadConfigsModel.query.filter_by(model_id=model_id).first()
    if not download_job:
        return 'Artifact for model id {} was not found on database'.format(model_id), 404
    downloadable_artifact = DownloadableArtifactsModel.query.filter_by(job_id=download_job.job_id).first()
    exist, archive_path = downloadable_artifact.archive_exists()
    if not exist:
        return 'Cannot find archive for model {}'.format(model_id), 404
    md5sum = md5(archive_path)
    return jsonify({'hash': md5sum})


@V1_DOWNLOAD_API.route('/test-log', methods=['POST'])
@safe_run
def test_log():
    return send_file(LOG_FILE, as_attachment=True)


@V1_DOWNLOAD_API.route('/project-report/<int:project_id>', methods=['GET'])
@safe_run
def export_project_report(project_id: int):
    tab_id = request.args.get('tabId')
    creator = ProjectReportExportPipelineCreator(tab_id=tab_id, project_id=project_id)
    pipeline = creator.create()
    creator.run_pipeline()
    return jsonify({'id': pipeline.id})


@V1_DOWNLOAD_API.route('/inference-report/<int:inference_id>', methods=['GET'])
@safe_run
def export_inference_report(inference_id: int):
    tab_id = request.args.get('tabId')
    creator = InferenceReportExportPipelineCreator(tab_id=tab_id, inference_id=inference_id)
    pipeline = creator.create()
    creator.run_pipeline()
    return jsonify({'id': pipeline.id})


@V1_EXPORT_PROJECT_API.route('/project/<int:project_id>/export', methods=['POST'])
@safe_run
def export_project(project_id: int):
    config = request.get_json()['data']
    config['projectId'] = project_id
    export_project_pipeline_creator = ExportProjectPipelineCreator(config)
    export_project_pipeline_creator.create()
    export_project_pipeline_creator.run_pipeline()
    export_project_job = export_project_pipeline_creator.first_job
    return jsonify(export_project_job.json())
