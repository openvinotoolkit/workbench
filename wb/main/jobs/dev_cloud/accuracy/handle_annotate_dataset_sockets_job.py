"""
 OpenVINO DL Workbench
 Class for handling sockets of dataset annotation from DevCloud service

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
from wb.main.console_tool_wrapper.dataset_annotator_tools import DatasetAnnotatorParser
from wb.main.enumerates import JobTypesEnum
from wb.main.jobs.dev_cloud.handle_dev_cloud_job_sockets_job import HandleDevCloudJobSocketsJob
from wb.main.jobs.interfaces.job_observers import JobStateDBObserver
from wb.main.jobs.interfaces.job_state import JobStateSubject
from wb.main.models import AnnotateDatasetJobModel


class HandleDevCloudAnnotateDatasetSocketsJob(HandleDevCloudJobSocketsJob):
    job_type = JobTypesEnum.handle_dev_cloud_dataset_annotation_sockets_job
    _job_state_subject_class = JobStateSubject
    _job_model_class = AnnotateDatasetJobModel
    _db_observer_class = JobStateDBObserver
    _console_tool_output_parser = DatasetAnnotatorParser

    def _create_job_state_subject(self) -> JobStateSubject:
        return self._job_state_subject_class(self.job_id)
