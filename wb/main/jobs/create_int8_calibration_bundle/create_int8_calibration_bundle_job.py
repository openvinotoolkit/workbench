"""
 OpenVINO DL Workbench
 Class for creation of int8 calibration bundle job

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
import os
from contextlib import closing

from sqlalchemy.orm import Session

from config.constants import ARTIFACTS_PATH
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.utils.database_functions import set_status_in_db
from wb.main.models import (CreateInt8CalibrationBundleJobModel, DownloadableArtifactsModel,
                            Int8CalibrationJobModel, CreateInt8CalibrationScriptsJobModel)
from wb.main.utils.bundle_creator.job_bundle_creator import JobBundleCreator, JobComponentsParams


class CreateInt8CalibrationBundleJob(IJob):
    _job_model_class = CreateInt8CalibrationBundleJobModel
    job_type = JobTypesEnum.create_int8_calibration_bundle_type

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, log='Creating int8 calibration bundle.')
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job_model = self.get_job_model(session)
            pipeline = job_model.pipeline
            int8_calibration_job_model: Int8CalibrationJobModel = pipeline.get_job_by_type(
                job_type=Int8CalibrationJobModel.get_polymorphic_job_type()
            )
            create_int8_scripts_job_model: CreateInt8CalibrationScriptsJobModel = job_model.pipeline.get_job_by_type(
                job_type=CreateInt8CalibrationScriptsJobModel.get_polymorphic_job_type()
            )
            project = job_model.project
            parent_project_model_path = project.topology.optimized_from_record.path
            dataset_path = int8_calibration_job_model.dataset.path
            bundle_id = job_model.bundle_id
        job_bundle_creator = JobBundleCreator(
            log_callback=lambda message, progress: self._job_state_subject.update_state(
                log=message, progress=progress))

        job_bundle_creator.create(
            components=JobComponentsParams(model_path=parent_project_model_path,
                                           dataset_path=dataset_path,
                                           job_run_script=create_int8_scripts_job_model.job_script_file_path,
                                           config_file=create_int8_scripts_job_model.int8_config_file_path),
            destination_bundle=os.path.join(ARTIFACTS_PATH, str(bundle_id)))

        self.on_success()

    def on_success(self):
        with closing(get_db_session_for_celery()) as session:
            job: CreateInt8CalibrationBundleJobModel = self.get_job_model(session)
            bundle: DownloadableArtifactsModel = job.bundle
            bundle_path = DownloadableArtifactsModel.get_archive_path(bundle.id)
            bundle.update(bundle_path)
            bundle.write_record(session)
            set_status_in_db(DownloadableArtifactsModel, bundle.id, StatusEnum.ready, session, force=True)
        self._job_state_subject.update_state(status=StatusEnum.ready,
                                             log='Int8 Calibration bundle creation successfully finished.')
        self._job_state_subject.detach_all_observers()
