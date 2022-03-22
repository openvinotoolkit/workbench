"""
 OpenVINO DL Workbench
 Class for handling sockets of profiling from DevCloud service

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
from wb.main.console_tool_wrapper.benchmark_app import BenchmarkConsoleOutputParser
from wb.main.enumerates import JobTypesEnum
from wb.main.jobs.dev_cloud.handle_dev_cloud_job_sockets_job import HandleDevCloudJobSocketsJob
from wb.main.jobs.interfaces.job_observers import ProfilingDBObserver
from wb.main.jobs.profiling.profiling_job_state import ProfilingJobStateSubject
from wb.main.models import ProfilingJobModel


class HandleDevCloudProfilingSocketsJob(HandleDevCloudJobSocketsJob):
    job_type = JobTypesEnum.handle_dev_cloud_profiling_sockets_job
    _job_model_class = ProfilingJobModel
    _job_state_subject_class = ProfilingJobStateSubject
    _db_observer_class = ProfilingDBObserver
    _console_tool_output_parser = BenchmarkConsoleOutputParser

    # Annotations
    _job_state_subject: ProfilingJobStateSubject

    def _create_job_state_subject(self) -> ProfilingJobStateSubject:
        with closing(get_db_session_for_celery()) as session:
            job: ProfilingJobModel = self.get_job_model(session)
            return ProfilingJobStateSubject(job_id=self.job_id,
                                            num_single_inferences=job.num_single_inferences,
                                            model_path=job.xml_model_path)
