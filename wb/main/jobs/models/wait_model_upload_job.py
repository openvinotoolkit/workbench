"""
 OpenVINO DL Workbench
 Class for waiting model upload job for model creation

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
from contextlib import closing
from pathlib import Path

from sqlalchemy.orm import Session

from config.constants import FILE_UPLOAD_RETRY_COUNTDOWN, FILE_UPLOAD_MAX_RETRY
from wb.error.job_error import ManualTaskRetryException
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum, StatusEnum, SupportedFrameworksEnum
from wb.main.jobs.models.base_model_related_job import BaseModelRelatedJob
from wb.main.models import TopologiesModel
from wb.main.models.wait_model_upload_job_model import WaitModelUploadJobModel


class WaitModelUploadJob(BaseModelRelatedJob):
    job_type = JobTypesEnum.wait_upload_model_type
    _job_model_class = WaitModelUploadJobModel

    def run(self):
        self._job_state_subject.update_state(log='Starting uploading model job', status=StatusEnum.running)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            upload_model_job: WaitModelUploadJobModel = self.get_job_model(session)
            model: TopologiesModel = upload_model_job.model
            if model.status in (StatusEnum.cancelled, StatusEnum.error):
                return
            self._job_state_subject.update_state(status=StatusEnum.running, progress=model.uploaded_progress)
            if not model.is_all_files_uploaded:
                raise ManualTaskRetryException('Model artifact is not uploaded yet, retry task',
                                               countdown=FILE_UPLOAD_RETRY_COUNTDOWN, max_retries=FILE_UPLOAD_MAX_RETRY)
            if model.framework == SupportedFrameworksEnum.mxnet:
                self._rename_mxnet_files()
            self._job_state_subject.update_state(status=StatusEnum.ready,
                                                 log='Model uploading successfully finished')
            self._job_state_subject.detach_all_observers()

    # pylint: disable=fixme
    # TODO: Remove as soon as Model Optimizer fixes filenames handling.
    def _rename_mxnet_files(self):
        with closing(get_db_session_for_celery()) as session:
            session: Session
            upload_model_job: WaitModelUploadJobModel = self.get_job_model(session)
            model: TopologiesModel = upload_model_job.model
            files = model.files
            for file in files:
                old_path = Path(file.path)
                new_name = model.name + {'.params': '-00001.params', '.json': '-symbol.json'}[old_path.suffix]
                new_path = old_path.parent / new_name
                if not old_path.is_file():
                    continue
                os.rename(str(old_path), str(new_path))
                file.path = str(new_path)
                file.name = new_name
                file.write_record(session)
