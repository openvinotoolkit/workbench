"""
 OpenVINO DL Workbench
 Class for remote per tensor report job

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
import os
import tarfile
from contextlib import closing

from sqlalchemy.orm import Session

from config.constants import (JOB_ARTIFACTS_FOLDER_NAME, JOB_ARTIFACTS_ARCHIVE_NAME, PYTHON_VIRTUAL_ENVIRONMENT_DIR)
from wb.error.job_error import AccuracyError
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum
from wb.main.jobs.accuracy_analysis.per_tensor.per_tensor_report_job import PerTensorReportJob
from wb.main.jobs.mixins.remote_job_mixin import RemoteJobMixin
from wb.main.jobs.utils.utils import collect_artifacts
from wb.main.models import AccuracyJobsModel, TargetModel


class RemotePerTensorReportJob(PerTensorReportJob, RemoteJobMixin):
    job_type = JobTypesEnum.remote_per_tensor_report_type

    def _set_paths(self, session: Session):
        """
        Set job paths for local and remote use-cases.
        This method mutates `job_bundle_path`, `_openvino_path` and `_venv_path` fields
        """
        accuracy_job_model: AccuracyJobsModel = self.get_job_model(session)
        target: TargetModel = accuracy_job_model.project.target
        self._openvino_path = target.bundle_path
        self._venv_path = os.path.join(self._openvino_path, PYTHON_VIRTUAL_ENVIRONMENT_DIR)

    def collect_artifacts(self):
        with closing(get_db_session_for_celery()) as session:
            job_model: AccuracyJobsModel = self.get_job_model(session)
            target = job_model.project.target
            result_archive = os.path.join(
                self.job_bundle_path,
                JOB_ARTIFACTS_FOLDER_NAME,
                JOB_ARTIFACTS_ARCHIVE_NAME
            )
            dest_archive = str(self.get_job_results_path(job_model) / JOB_ARTIFACTS_ARCHIVE_NAME)
            collect_artifacts(target.id, result_archive, dest_archive, session)
            with tarfile.open(dest_archive, 'r:gz') as tar:
                def is_within_directory(directory, target):
                    
                    abs_directory = os.path.abspath(directory)
                    abs_target = os.path.abspath(target)
                
                    prefix = os.path.commonprefix([abs_directory, abs_target])
                    
                    return prefix == abs_directory
                
                def safe_extract(tar, path=".", members=None, *, numeric_owner=False):
                
                    for member in tar.getmembers():
                        member_path = os.path.join(path, member.name)
                        if not is_within_directory(path, member_path):
                            raise Exception("Attempted Path Traversal in Tar File")
                
                    tar.extractall(path, members, numeric_owner=numeric_owner) 
                    
                
                safe_extract(tar, path=self.get_job_results_path(job_model))

    def on_success(self):
        super().on_success()
        self._clean_paths()

    def _clean_paths(self):
        return_code, output = self.clean_remote_paths()
        if return_code:
            message = f'Cannot remove folder {self.job_bundle_path}: {output}'
            raise AccuracyError(message, self._job_id)
