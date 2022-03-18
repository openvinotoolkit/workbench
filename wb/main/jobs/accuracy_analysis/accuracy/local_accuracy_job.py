"""
 OpenVINO DL Workbench
 Class for local accuracy job

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
from wb.main.jobs.accuracy_analysis.accuracy.accuracy_job import AccuracyJob
from wb.main.jupyter_notebooks.update_jupyter_notebook_decorator import update_jupyter_notebook_job
from wb.main.models import AccuracyJobsModel


# TODO Consider renaming class to CreateAccuracyReportJob
@update_jupyter_notebook_job
class LocalAccuracyJob(AccuracyJob):
    job_type = JobTypesEnum.accuracy_type

    def _set_paths(self, session: Session):
        """
        Set job paths for local and remote use-cases.
        This method mutates `job_bundle_path`, `_openvino_path` and `_venv_path` fields
        """
        accuracy_job_model: AccuracyJobsModel = self.get_job_model(session)
        self.job_bundle_path = str(self.get_accuracy_artifacts_path(accuracy_job_model))
        self._openvino_path = OPENVINO_ROOT_PATH
        self._venv_path = None

    def collect_artifacts(self):
        pass
