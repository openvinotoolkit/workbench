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
import os
from contextlib import closing

from config.constants import ARTIFACTS_PATH
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.utils.database_functions import set_status_in_db
from wb.main.models import CreateProfilingBundleJobModel, DownloadableArtifactsModel, ProfilingJobModel
from wb.main.utils.bundle_creator.job_bundle_creator import JobBundleCreator, ProfilingComponentsParams
from wb.main.utils.utils import get_size_of_files


class CreateProfilingBundleJob(IJob):
    job_type = JobTypesEnum.create_profiling_bundle_type
    _job_model_class = CreateProfilingBundleJobModel

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, log='Creating profiling bundle.')
        with closing(get_db_session_for_celery()) as session:
            job_model = self.get_job_model(session)
            pipeline_id = job_model.pipeline_id
            profiling_job: ProfilingJobModel = session.query(ProfilingJobModel) \
                .filter_by(pipeline_id=pipeline_id).first()
            project = job_model.project
            model_path = project.topology.path
            dataset_path = profiling_job.input_data_base_dir_path
            bundle_id = job_model.bundle_id

        configuration_file_path = str(profiling_job.configuration_file_path)
        job_script_path = str(profiling_job.profiling_job_script_path)

        profiling_bundle_creator = JobBundleCreator(
            log_callback=lambda message, progress: self._job_state_subject.update_state(
                log=message, progress=progress)
        )

        profiling_bundle_creator.create(
            components=ProfilingComponentsParams(model_path=model_path,
                                                 dataset_path=dataset_path,
                                                 job_run_script=job_script_path,
                                                 config_file=configuration_file_path),
            destination_bundle=os.path.join(ARTIFACTS_PATH, str(bundle_id)))

        self.on_success()

    def on_success(self):
        with closing(get_db_session_for_celery()) as session:
            job = self.get_job_model(session)
            bundle = job.bundle
            bundle_path = DownloadableArtifactsModel.get_archive_path(bundle.id)
            bundle.path = bundle_path
            bundle.size = get_size_of_files(bundle_path)
            bundle.write_record(session)
            set_status_in_db(DownloadableArtifactsModel, bundle.id, StatusEnum.ready, session, force=True)
            self._job_state_subject.update_state(status=StatusEnum.ready,
                                                 log='Profiling bundle creation successfully finished.')
            self._job_state_subject.detach_all_observers()
