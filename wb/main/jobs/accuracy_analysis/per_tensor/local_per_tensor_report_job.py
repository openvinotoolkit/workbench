"""
 OpenVINO DL Workbench
 Class for local per tensor report job

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
from sqlalchemy.orm import Session

from config.constants import OPENVINO_ROOT_PATH
from wb.main.enumerates import JobTypesEnum
from wb.main.jobs.accuracy_analysis.per_tensor.per_tensor_report_job import PerTensorReportJob
from wb.main.models import AccuracyJobsModel


class LocalPerTensorReportJob(PerTensorReportJob):
    def _set_paths(self, session: Session):
        """
        Set job paths for local and remote use-cases.
        This method mutates `job_bundle_path`, `_openvino_path` and `_venv_path` fields
        """
        accuracy_job_model: AccuracyJobsModel = self.get_job_model(session)
        self.job_bundle_path = str(self.get_artifacts_path(accuracy_job_model))
        self._openvino_path = OPENVINO_ROOT_PATH
        self._venv_path = None

    def collect_artifacts(self):
        pass
