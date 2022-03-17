"""
 OpenVINO DL Workbench
 Class to handle environment related requests

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
