"""
 OpenVINO DL Workbench
 Class for create profiling bundle job

 Copyright (c) 2020 Intel Corporation

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
from contextlib import closing

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.utils.database_functions import set_status_in_db
from wb.main.models import CreateProfilingBundleJobModel, ProfilingJobModel, SharedArtifactModel
from wb.main.utils.bundle_creator.job_bundle_creator import JobBundleCreator, ProfilingComponentsParams


class CreateProfilingBundleJob(IJob):
    job_type = JobTypesEnum.create_profiling_bundle_type
    _job_model_class = CreateProfilingBundleJobModel

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._attach_default_db_and_socket_observers()
        with closing(get_db_session_for_celery()) as session:
            job_model: CreateProfilingBundleJobModel = self.get_job_model(session)
            pipeline_id = job_model.pipeline_id
            profiling_job: ProfilingJobModel = session.query(ProfilingJobModel) \
                .filter_by(pipeline_id=pipeline_id).first()
            project = job_model.project
            self.model_path = project.topology.path
            self.dataset_path = profiling_job.input_data_base_dir_path
            self.bundle_path = job_model.shared_artifact.build_full_artifact_path()
            self.is_archive = job_model.shared_artifact.is_archive
            self.configuration_file_path = str(profiling_job.configuration_file_path)
            self.job_script_path = str(profiling_job.profiling_job_script_path)

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, log='Creating profiling bundle.')

        profiling_bundle_creator = JobBundleCreator(
            log_callback=lambda message, progress: self._job_state_subject.update_state(
                log=message, progress=progress)
        )

        profiling_bundle_creator.create(
            components=ProfilingComponentsParams(model_path=self.model_path,
                                                 dataset_path=self.dataset_path,
                                                 job_run_script=self.job_script_path,
                                                 config_file=self.configuration_file_path),
            destination_bundle=self.bundle_path,
            is_archive=self.is_archive
        )

        self.on_success()

    def on_success(self):
        with closing(get_db_session_for_celery()) as session:
            job = self.get_job_model(session)
            job.shared_artifact.update(self.bundle_path)
            job.shared_artifact.write_record(session)
            self._job_state_subject.update_state(status=StatusEnum.ready,
                                                 log='Profiling bundle creation successfully finished.')
            set_status_in_db(SharedArtifactModel, job.shared_artifact.id, StatusEnum.ready, session, force=True)
            self._job_state_subject.detach_all_observers()
