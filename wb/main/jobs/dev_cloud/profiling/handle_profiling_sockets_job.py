"""
 OpenVINO DL Workbench
 Class for handling sockets of profiling from DevCloud service

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
