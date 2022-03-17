"""
 OpenVINO DL Workbench
 Class for handling sockets of accuracy from DevCloud service

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
