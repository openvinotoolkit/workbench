"""
 OpenVINO DL Workbench
 Class for handling sockets of accuracy from DevCloud service

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
from wb.main.console_tool_wrapper.accuracy_tools import AccuracyCheckerParser
from wb.main.enumerates import JobTypesEnum
from wb.main.jobs.accuracy_analysis.accuracy.accuracy_job_state import AccuracyJobStateSubject, AccuracyDBObserver
from wb.main.jobs.dev_cloud.handle_dev_cloud_job_sockets_job import HandleDevCloudJobSocketsJob
from wb.main.models import AccuracyJobsModel


class HandleDevCloudAccuracySocketsJob(HandleDevCloudJobSocketsJob):
    job_type = JobTypesEnum.handle_dev_cloud_accuracy_sockets_job
    _job_state_subject_class = AccuracyJobStateSubject
    _job_model_class = AccuracyJobsModel
    _db_observer_class = AccuracyDBObserver
    _console_tool_output_parser = AccuracyCheckerParser

    def _create_job_state_subject(self) -> AccuracyJobStateSubject:
        return self._job_state_subject_class(self.job_id)
