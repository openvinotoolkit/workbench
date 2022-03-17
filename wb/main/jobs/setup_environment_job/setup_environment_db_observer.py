"""
 OpenVINO DL Workbench
 Implementation specific data base observer for create environment job

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
from contextlib import closing
from sqlalchemy.orm import Session

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import StatusEnum
from wb.main.jobs.interfaces.job_observers import JobStateDBObserver, check_existing_job_model_decorator
from wb.main.jobs.setup_environment_job.setup_environment_job_state import SetupEnvironmentJobState
from wb.main.models import SetupEnvironmentJobModel, PipelineModel, TopologyAnalysisJobsModel, TopologiesModel


class SetupEnvironmentDBObserver(JobStateDBObserver):
    _mapper_class = SetupEnvironmentJobModel

    @check_existing_job_model_decorator
    def update(self, subject_state: SetupEnvironmentJobState):
        with closing(get_db_session_for_celery()) as session:
            job: SetupEnvironmentJobModel = self.get_job_model(session)
            job.progress = subject_state.progress or job.progress
            job.status = subject_state.status or job.status
            job.error_message = subject_state.error_message or job.error_message
            job.write_record(session)

            pipeline: PipelineModel = job.pipeline
            self._update_model_state(pipeline, subject_state, session)

            if subject_state.environment_id:
                model = job.model
                model.environment_id = subject_state.environment_id
                model.write_record(session)

                environment = model.environment
                environment.is_ready = subject_state.status == StatusEnum.ready
                environment.write_record(session)

    @staticmethod
    def _update_model_state(pipeline: PipelineModel, subject_state: SetupEnvironmentJobState, session: Session):
        model_analyzer_job = session.query(TopologyAnalysisJobsModel).filter_by(pipeline_id=pipeline.id).first()
        model: TopologiesModel = model_analyzer_job.model
        model.progress = pipeline.pipeline_progress
        if model.status != StatusEnum.cancelled:
            model.status = pipeline.pipeline_status_name
        if subject_state.status == StatusEnum.error:
            model.error_message = subject_state.error_message or model.error_message
        model.write_record(session)
