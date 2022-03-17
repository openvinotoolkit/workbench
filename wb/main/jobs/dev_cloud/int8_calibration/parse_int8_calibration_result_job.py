"""
 OpenVINO DL Workbench
 Class for parsing DevCloud int8 calibration result job

 Copyright (c) 2020 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
import logging as log
import tarfile
from contextlib import closing

from wb.error.job_error import ManualTaskRetryException
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.jobs.int8_calibration.int8_calibration_job import Int8CalibrationJob
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.interfaces.job_observers import ParseDevCloudResultDBObserver
from wb.main.enumerates import JobTypesEnum
from wb.main.models.downloadable_artifacts_model import DownloadableArtifactsModel
from wb.main.enumerates import StatusEnum
from wb.main.models.parse_dev_cloud_int8_calibration_result_job_model import ParseDevCloudInt8CalibrationResultJobModel
from wb.main.utils.utils import create_empty_dir


class ParseDevCloudInt8CalibrationResultJob(IJob):
    job_type = JobTypesEnum.parse_dev_cloud_int8_calibration_result_job
    _job_model_class = ParseDevCloudInt8CalibrationResultJobModel

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        database_observer = ParseDevCloudResultDBObserver(job_id=self._job_id)
        self._job_state_subject.attach(database_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running,
                                             log='Starting parse DevCloud int8 calibration result job')
        with closing(get_db_session_for_celery()) as session:
            parse_profiling_result_job_model: ParseDevCloudInt8CalibrationResultJobModel = self.get_job_model(session)
            result_artifact: DownloadableArtifactsModel = parse_profiling_result_job_model.result_artifact
            if not result_artifact.is_all_files_uploaded:
                raise ManualTaskRetryException('Int8 Calibration result artifact is not uploaded yet, retry task')

            artifact_path = result_artifact.files[0].path
            int8_model = parse_profiling_result_job_model.int8_model

        self.extract_calibrated_model(artifact_path, int8_model.path)
        log.debug('Parsing int8 calibration result artifact and saving data to database')
        self.on_success()

    def extract_calibrated_model(self, archive_path: str, destination_path: str):
        create_empty_dir(destination_path)
        with tarfile.open(archive_path, 'r:gz') as tar:
            tar.extractall(destination_path)
        Int8CalibrationJob.move_optimized_model(destination_path, destination_path, self.job_id)

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready,
                                             log='Parse DevCloud int8 calibration result job successfully finished')
        self._job_state_subject.detach_all_observers()
