"""
 OpenVINO DL Workbench
 Class to environment managements

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
from enum import Enum
from typing import Optional, List

from sqlalchemy.orm import Session

from wb.main.environment.creator import EnvironmentCreatorFactory, EnvironmentCreator
from wb.main.environment.manifest import Manifest
from wb.main.environment.status_reporter import StatusReporter, EnvironmentState
from wb.main.environment.validators import EnvironmentValidatorFactory, EnvironmentValidator
from wb.main.models import EnvironmentModel


class EnvironmentManagerStageEnum(Enum):
    validation = 'validation'
    creation = 'creation'


class EnvironmentManagerState(EnvironmentState):
    _stages = EnvironmentManagerStageEnum


class EnvironmentManagerStatusReporter(StatusReporter):
    _state_class = EnvironmentManagerState

    def start_validation(self):
        self._state.set_current_stage(stage=EnvironmentManagerStageEnum.validation)
        self.report_status()

    def start_creation(self):
        self._state.finish_current_stage()
        self._state.set_current_stage(stage=EnvironmentManagerStageEnum.creation)
        self.report_status()


class EnvironmentManager:
    def __init__(self, manifest: Manifest, log_callback=None):
        self._manifest: Manifest = manifest
        self._status_reporter = EnvironmentManagerStatusReporter(log_callback)
        self._validator: EnvironmentValidator = EnvironmentValidatorFactory.create(self._manifest)
        self._creator: EnvironmentCreator = EnvironmentCreatorFactory.create(self._manifest,
                                                                             self._status_reporter.status_callback)

    def get_suitable_environment(self, session: Session,
                                 create_if_not_exist: bool = True,
                                 is_prc: bool = False) -> Optional[EnvironmentModel]:
        self._status_reporter.start_validation()
        environment = self._find_valid_environment(session)
        if not environment and create_if_not_exist:
            self._status_reporter.start_creation()
            environment = self._create_environment(session=session, is_prc=is_prc)
        self._status_reporter.update_progress(100)
        return environment

    def validate(self, environment: EnvironmentModel) -> bool:
        result = self._validator.validate(environment)
        return result

    def _find_valid_environment(self, session: Session) -> Optional[EnvironmentModel]:
        environments: List[EnvironmentModel] = session.query(EnvironmentModel).all()
        one_env_percent = 50 / max(len(environments), 1)
        for index, environment in enumerate(environments):
            if self.validate(environment):
                return environment
            self._status_reporter.update_progress(one_env_percent * index)
        return None

    def _create_environment(self, session: Session, is_prc: bool) -> EnvironmentModel:
        return self._creator.create(session, is_prc)
