"""
 OpenVINO DL Workbench
 Endpoints to work with downloading of files

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
from typing import Optional

from flask import jsonify, request

from wb.error.entry_point_error import InconsistentConfigError
from wb.extensions_factories.database import get_db_session_for_app
from wb.main.api_endpoints.utils import md5
from wb.main.api_endpoints.v1 import V1_DEPLOYMENT_API
from wb.main.models.deployment_bundle_config_model import DeploymentBundleConfigModel
from wb.main.models.downloadable_artifacts_model import DownloadableArtifactsModel
from wb.main.enumerates import DeploymentTargetEnum, TargetTypeEnum, StatusEnum, TargetOSEnum
from wb.main.models.projects_model import ProjectsModel
from wb.main.models.target_model import TargetModel
from wb.main.pipeline_creators.deployment_manager_pipeline_creator import DeploymentManagerPipelineCreator
from wb.main.utils.safe_runner import safe_run


def check_config(data: dict):
    target_os = data['targetOS']
    try:
        TargetOSEnum(target_os)
    except ValueError:
        raise InconsistentConfigError('Unsupported target OS')

    if data.get('includeModel'):
        if not data.get('projectId'):
            raise InconsistentConfigError('No projectId in the request')
        project = ProjectsModel.query.get(data['projectId'])
        if not project:
            raise InconsistentConfigError('Cannot find project with id {}'.format(data['projectId']))

    targets = data.get('targets')
    if not targets:
        raise InconsistentConfigError('No targets in the request')

    try:
        [DeploymentTargetEnum.create(target) for target in targets]
    except ValueError:
        raise InconsistentConfigError('Unsupported target')


def prepare_config(data: dict) -> dict:
    deploy_configuration = data.copy()

    check_config(deploy_configuration)

    targets = [DeploymentTargetEnum.create(target).value for target in deploy_configuration['targets']]
    deploy_configuration['operatingSystem'] = data['targetOS']

    deploy_configuration['targets'] = sorted(DeploymentTargetEnum(target).value.upper() for target in targets)

    project_id = deploy_configuration.get('projectId', False)
    if project_id and deploy_configuration.get('includeModel', False):
        project = ProjectsModel.query.get(project_id)

        if deploy_configuration['includeModel']:
            deploy_configuration['modelName'] = project.topology.name

    setup_script = data.get('installScripts', False)
    deploy_configuration['setupScript'] = setup_script

    if data.get('pythonBindings', False):
        deploy_configuration['targets'].extend(DeploymentTargetEnum.get_python_targets())

    deploy_configuration['getDevicesScript'] = False
    deploy_configuration['getResourcesScript'] = False
    deploy_configuration['edgeNodeSetupScript'] = True

    return deploy_configuration


def find_artifact_for_configuration(project_id: int, configuration: dict) -> Optional[DownloadableArtifactsModel]:
    # pylint: disable=no-value-for-parameter
    deployment_configs = DeploymentBundleConfigModel.query.filter(
        DeploymentBundleConfigModel.is_equal_to_config(configuration)
    ).all()
    for config in deployment_configs:
        deployment_bundle = config.deployment_bundle
        if (config.target_equals(configuration['targets']) and
            config.setup_bundle_job.project_id == project_id and
                deployment_bundle.status in (StatusEnum.ready,
                                             StatusEnum.running,
                                             StatusEnum.queued)):
            return deployment_bundle
    return None


@V1_DEPLOYMENT_API.route('/deployment', methods=['POST'])
@safe_run
def deployment_manager():
    data = request.get_json()
    configuration = prepare_config(data)
    artifact = find_artifact_for_configuration(data.get('projectId'), configuration)
    if artifact:
        exists, _ = artifact.archive_exists()
        if exists:
            return jsonify({
                'jobId': None,
                'status': artifact.status.value,
                'exist': exists,
                'message': 'archive already exists',
                'artifactId': artifact.id,
                'targets': configuration['targets'],
                'modelName': configuration.get('modelName'),
                'operatingSystem': configuration['operatingSystem']
            })
        artifact.delete_record(get_db_session_for_app())
    target = TargetModel.query.filter_by(target_type=TargetTypeEnum.local).first()
    deployment_manager_pipeline_creator = DeploymentManagerPipelineCreator(target.id, configuration)
    deployment_manager_pipeline_creator.create()
    deployment_manager_pipeline_creator.run_pipeline()
    deployment_manager_job = deployment_manager_pipeline_creator.first_job
    return jsonify(deployment_manager_job.json())


@V1_DEPLOYMENT_API.route('/check-sum/deployment', methods=['POST'])
@safe_run
def check_sum_deploy_archive():
    data = request.get_json()
    configuration = prepare_config(data)
    artifact = find_artifact_for_configuration(data.get('projectId'), configuration)
    md5sum = None
    if artifact:
        exists, path = artifact.archive_exists()
        md5sum = md5(path) if exists else None
    return jsonify({'hash': md5sum})
