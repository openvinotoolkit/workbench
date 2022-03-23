"""
 OpenVINO DL Workbench
 Functions for analyzing database restore status

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
import os
from contextlib import closing
from pathlib import Path
from typing import List

from sqlalchemy.orm import Session

from config.constants import CLOUD_SERVICE_SESSION_TTL_MINUTES
from wb.extensions_factories.database import get_db_session_for_app
from wb.main.enumerates import StatusEnum
from wb.main.environment.manifest import ManifestFactory
from wb.main.environment.validators import EnvironmentValidatorFactory
from wb.main.models import (ArtifactsModel, DatasetsModel, EnvironmentModel,
                            JobExecutionDetailsModel, JobsModel, RemoteTargetModel,
                            TopologiesModel, UsersModel, WorkbenchSession)
from wb.main.utils.utils import generate_token_or_get_from_file

SKIP_ARCHIVATION_STATUSES = [StatusEnum.archived, StatusEnum.cancelled, StatusEnum.error]


def validate(app):
    with app.app_context():
        with closing(get_db_session_for_app()) as session:
            _validate_artifacts(session)
            _update_token(session)
            _cancel_stale_jobs(session)
            _validate_remote_machines(session)
            _validate_workbench_session_ttl(session)
            _validate_environments(session)


def _validate_artifacts(session: Session):
    datasets = session.query(DatasetsModel).filter(DatasetsModel.status.notin_(SKIP_ARCHIVATION_STATUSES)).all()
    models = session.query(TopologiesModel).filter(TopologiesModel.status.notin_(SKIP_ARCHIVATION_STATUSES)).all()

    artifacts: List[ArtifactsModel] = [*datasets, *models]

    for artifact in artifacts:
        # if upload was not finished successfully
        if artifact.status in [StatusEnum.running, StatusEnum.queued]:
            artifact.status = StatusEnum.cancelled
        elif not artifact.artifact_exists():
            artifact.status = StatusEnum.archived
        elif not _is_valid_artifact(artifact):
            pass
            # raise AssertionError(
            #     f'Artifact at {artifact.path} is not valid. Checksum does not match or it is a symlink')

        artifact.write_record(session)


def _is_valid_artifact(artifact: ArtifactsModel) -> bool:
    checksum = ArtifactsModel.get_dir_hash(artifact.path)

    return checksum == artifact.checksum and not Path(artifact.path).is_symlink()


def _update_token(session: Session):
    login_token = generate_token_or_get_from_file()

    user = session.query(UsersModel).one()
    user.set_login_token(login_token)
    user.write_record(session)


def _validate_remote_machines(session: Session):
    machines = session.query(RemoteTargetModel).all()

    for machine in machines:
        if machine.private_key_path and not os.path.exists(machine.private_key_path):
            machine.private_key_path = None
            machine.write_record(session)


def _cancel_stale_jobs(session: Session):
    """
    Set cancelled status for jobs that has running or queued status at startup time.
    For example background job process or server was killed during operation.
    """
    statuses_to_cancel = [StatusEnum.running, StatusEnum.queued]
    session.query(JobsModel) \
        .filter(JobsModel.status.in_(statuses_to_cancel)) \
        .update({JobsModel.status: StatusEnum.cancelled, JobsModel.error_message: 'process unexpectedly exited'},
                synchronize_session='fetch')

    session.query(JobExecutionDetailsModel) \
        .filter(JobExecutionDetailsModel.status.in_(statuses_to_cancel)) \
        .update({JobExecutionDetailsModel.status: StatusEnum.cancelled,
                 JobExecutionDetailsModel.error_message: 'process unexpectedly exited'}, synchronize_session='fetch')

    session.commit()


def _validate_workbench_session_ttl(session: Session):
    session.query(WorkbenchSession).delete()
    session.commit()

    if not CLOUD_SERVICE_SESSION_TTL_MINUTES:
        return

    workbench_session = WorkbenchSession(ttl_seconds=CLOUD_SERVICE_SESSION_TTL_MINUTES * 60)
    workbench_session.write_record(session)


def _validate_environments(session: Session):
    environments: List[EnvironmentModel] = session.query(EnvironmentModel).filter_by(is_ready=True).all()
    for environment in environments:

        environment_path = Path(environment.path)
        manifest_path = Path(environment.manifest_path)
        if not environment_path.is_dir() or not manifest_path or not manifest_path.exists():
            environment.mark_as_not_ready(session)
            continue

        manifest = ManifestFactory.load_from_file(manifest_path)

        environment_validator = EnvironmentValidatorFactory.create(manifest)

        if not environment_validator.validate(environment):
            environment.mark_as_not_ready(session)
