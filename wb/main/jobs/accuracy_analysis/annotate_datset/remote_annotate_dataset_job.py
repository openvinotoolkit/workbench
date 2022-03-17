"""
 OpenVINO DL Workbench
 Class for annotate dataset job

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
import os
import tarfile
from contextlib import closing

from sqlalchemy.orm import Session

from config.constants import PYTHON_VIRTUAL_ENVIRONMENT_DIR, JOB_ARTIFACTS_FOLDER_NAME, JOB_ARTIFACTS_ARCHIVE_NAME
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum
from wb.main.jobs.accuracy_analysis.annotate_datset.annotate_dataset_job import AnnotateDatasetJob
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.mixins.remote_job_mixin import RemoteJobMixin
from wb.main.jobs.utils.utils import collect_artifacts
from wb.main.models import TargetModel, AnnotateDatasetJobModel


class RemoteAnnotateDatasetJob(AnnotateDatasetJob, RemoteJobMixin):
    job_type = JobTypesEnum.remote_annotate_dataset

    def _set_paths(self, session: Session):
        """
        Set job paths for local and remote use-cases.
        This method mutates `_openvino_path` and `_venv_path` fields
        """
        job_model = self.get_job_model(session)
        target: TargetModel = job_model.project.target
        self._openvino_path = target.bundle_path
        self._venv_path = os.path.join(self._openvino_path, PYTHON_VIRTUAL_ENVIRONMENT_DIR)

    def collect_artifacts(self):
        with closing(get_db_session_for_celery()) as session:
            job_model: AnnotateDatasetJobModel = self.get_job_model(session)
            target = job_model.project.target
            result_archive = os.path.join(
                self.job_bundle_path,
                JOB_ARTIFACTS_FOLDER_NAME,
                JOB_ARTIFACTS_ARCHIVE_NAME
            )
            dest_archive = str(self.get_job_results_path(job_model) / JOB_ARTIFACTS_ARCHIVE_NAME)
            collect_artifacts(target.id, result_archive, dest_archive, session)

            with tarfile.open(dest_archive, 'r:gz') as tar:
                tar.extractall(path=job_model.result_dataset.path)
