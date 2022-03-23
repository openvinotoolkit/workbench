"""
 OpenVINO DL Workbench
 Class for handling sockets of Int8 Calibration from DevCloud service

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

from wb.main.console_tool_wrapper.post_training_optimization.console_output_parser import \
    PostTrainingOptimizationParser
from wb.main.enumerates import JobTypesEnum
from wb.main.jobs.dev_cloud.handle_dev_cloud_job_sockets_job import HandleDevCloudJobSocketsJob
from wb.main.jobs.interfaces.job_observers import Int8CalibrationDBObserver
from wb.main.jobs.interfaces.job_state import JobStateSubject
from wb.main.models import Int8CalibrationJobModel


class HandleDevCloudInt8CalibrationSocketsJob(HandleDevCloudJobSocketsJob):
    job_type = JobTypesEnum.handle_dev_cloud_int8_calibration_sockets_job
    _job_model_class = Int8CalibrationJobModel
    _db_observer_class = Int8CalibrationDBObserver
    _console_tool_output_parser = PostTrainingOptimizationParser

    def _create_job_state_subject(self) -> JobStateSubject:
        return self._job_state_subject_class(self.job_id)
