"""
 OpenVINO DL Workbench
 Class to handle environment related requests

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

import enum

from sqlalchemy.orm import Session

from wb.main.api_endpoints.v1.cancel import cancel_job_in_db, cancel_artifacts_uploads
from wb.main.enumerates import SupportedFrameworksEnum, StatusEnum
from wb.main.environment.manager import EnvironmentManager
from wb.main.environment.manifest import ManifestFactory
from wb.main.models import SetupEnvironmentJobModel


class EnvironmentStatusEnum(enum.Enum):
    not_configured = 'not_configured'
    configuring = 'configuring'
    configured = 'configured'


class EnvironmentAPIHandler:

    @staticmethod
    def get_framework_specific_environments_status(session: Session):
        framework_environments = {}
        for framework in SupportedFrameworksEnum:
            framework_environments[framework.value] = EnvironmentStatusEnum.not_configured.value
            if framework == SupportedFrameworksEnum.openvino:
                framework_environments[framework.value] = EnvironmentStatusEnum.configured.value
                continue
            manifest = ManifestFactory.create_framework_specific(framework)
            environment_manager = EnvironmentManager(manifest)

            if environment_manager.get_suitable_environment(session, create_if_not_exist=False):
                framework_environments[framework.value] = EnvironmentStatusEnum.configured.value
                continue
        return framework_environments

    @staticmethod
    def stop_all_running_environments(session: Session):
        running_setup_jobs = session.query(SetupEnvironmentJobModel).filter(
            SetupEnvironmentJobModel.status.in_([StatusEnum.running, StatusEnum.queued])
        ).all()
        models_ids = tuple(job.model_id for job in running_setup_jobs)
        cancel_artifacts_uploads(models_ids)
