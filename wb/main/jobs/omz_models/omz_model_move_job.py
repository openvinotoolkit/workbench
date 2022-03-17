"""
 OpenVINO DL Workbench
 Class for job to move files after OMZ download

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
import json
import os
import shutil
from contextlib import closing

from sqlalchemy.orm import Session

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.jobs.interfaces.job_observers import OMZModelDownloadDBObserver
from wb.main.enumerates import SupportedFrameworksEnum, JobTypesEnum, StatusEnum
from wb.main.jobs.models.base_model_related_job import BaseModelRelatedJob
from wb.main.models import OMZModelMoveJobModel, TopologiesModel
from wb.main.models.omz_model_convert_job_model import OMZModelConvertJobModel
from wb.main.models.omz_model_download_job_model import OMZModelDownloadJobModel
from wb.main.utils.utils import create_empty_dir
from wb.main.utils.utils import remove_dir


class OMZModelMoveJob(BaseModelRelatedJob):
    job_type = JobTypesEnum.omz_model_move_type
    _job_model_class = OMZModelMoveJobModel

    def _create_and_attach_observers(self):
        model_download_db_observer = OMZModelDownloadDBObserver(job_id=self.job_id, mapper_class=self._job_model_class)
        self._job_state_subject.attach(model_download_db_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(log='Moving downloaded OMZ model files', status=StatusEnum.running)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            move_model_job: OMZModelMoveJobModel = self.get_job_model(session)
            result_model: TopologiesModel = move_model_job.model
            model_download_job: OMZModelDownloadJobModel = session.query(OMZModelDownloadJobModel).filter_by(
                result_model_id=result_model.id).first()
            precision = model_download_job.precision
            if result_model.downloaded_from_record.framework != SupportedFrameworksEnum.openvino:
                model_downloader_conversion_job: OMZModelConvertJobModel = (
                    session.query(OMZModelConvertJobModel)
                        .filter_by(result_model_id=result_model.id)
                        .first()
                )
                conversion_args = json.loads(model_downloader_conversion_job.conversion_args)
                precision = conversion_args.get('precision') or precision
            create_empty_dir(move_model_job.destination_path)
            src_dir = os.path.join(move_model_job.source_path, precision)
            for file_name in os.listdir(src_dir):
                full_file_name = os.path.join(src_dir, file_name)
                if os.path.isfile(full_file_name):
                    shutil.move(full_file_name, move_model_job.destination_path)
            remove_dir(move_model_job.source_path)
        self._job_state_subject.update_state(status=StatusEnum.ready, progress=100)
        self._job_state_subject.detach_all_observers()

    def on_failure(self, exception: Exception):
        super().on_failure(exception)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            move_model_job: OMZModelMoveJobModel = self.get_job_model(session)
            remove_dir(move_model_job.destination_path)
