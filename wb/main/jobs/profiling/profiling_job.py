"""
 OpenVINO DL Workbench
 Class for profiling job

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
from contextlib import closing

from sqlalchemy.orm import Session

from wb.error.job_error import ProfilingError
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.benchmark_app import BenchmarkConsoleOutputParser
from wb.main.console_tool_wrapper.workbench_job_tool import WorkbenchJobTool
from wb.main.enumerates import StatusEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.interfaces.job_observers import ProfilingDBObserver
from wb.main.jobs.profiling.profiling_job_state import ProfilingJobStateSubject
from wb.main.jobs.tools_runner.runner_creator import create_runner
from wb.main.models import ProfilingJobModel


class ProfilingJob(IJob):
    _job_model_class = ProfilingJobModel

    # Annotations
    _job_state_subject: ProfilingJobStateSubject

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)

        with closing(get_db_session_for_celery()) as session:
            # path to directory with profiling assets and scripts folder
            job: ProfilingJobModel = self.get_job_model(session)
            self._job_state_subject = ProfilingJobStateSubject(job_id=self._job_id,
                                                               num_single_inferences=job.num_single_inferences,
                                                               model_path=job.xml_model_path)
            self.openvino_bundle_path = self.get_openvino_bundle_path(session)

        profiling_job_db_observer = ProfilingDBObserver(job_id=self.job_id)
        self._job_state_subject.attach(profiling_job_db_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, progress=0)

        with closing(get_db_session_for_celery()) as session:
            profiling_job = self.get_job_model(session)
            project = profiling_job.project
            target_id = project.target_id

            parser = BenchmarkConsoleOutputParser(self._job_state_subject)

            tool = self.create_profiling_tool(profiling_job)

            runner = create_runner(target_id=target_id, tool=tool,
                                   parser=parser, session=session,
                                   working_directory=self.openvino_bundle_path)

        return_code, output = runner.run_console_tool(self, measure_performance=True)
        if return_code:
            raise ProfilingError(output, self.job_id)

        self.on_success()

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready, progress=100)

    def get_bundle_path(self, session: Session) -> str:
        raise NotImplementedError

    def get_openvino_bundle_path(self, session: Session) -> str:
        raise NotImplementedError

    def create_profiling_tool(self, job: ProfilingJobModel) -> WorkbenchJobTool:
        raise NotImplementedError
