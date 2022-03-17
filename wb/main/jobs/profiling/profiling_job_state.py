"""
 OpenVINO DL Workbench
 Class for remote profiling job

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
from datetime import datetime
from functools import wraps
from typing import List, Optional, Callable

from wb.main.enumerates import StatusEnum
from wb.main.jobs.interfaces.job_state import JobStateSubject, JobState
from wb.main.utils.observer_pattern import notify_decorator
from wb.main.utils.profiling_run_info import SingleProfilingRunInfo


def calc_job_aggregated_progress_and_status(function) -> Callable:
    @wraps(function)
    def decorated_function(job_state: 'ProfilingJobState', *args, **kwargs):
        function(job_state, *args, **kwargs)
        current_benchmark_info = job_state.get_current_benchmark_run_info()
        if not current_benchmark_info:
            return
        aggregated_progress = min(
            sum(run.progress for run in job_state.benchmark_runs_info) / job_state.num_benchmark_runs, 99)
        job_state.progress = aggregated_progress
        aggregated_status = current_benchmark_info.status
        if job_state.progress != 100 and aggregated_status == StatusEnum.ready:
            aggregated_status = StatusEnum.running
        job_state.status = aggregated_status

    return decorated_function


def check_benchmark_run_info(function) -> Callable:
    @wraps(function)
    def decorated_function(job_state: 'ProfilingJobState', *args, **kwargs):
        benchmark_run_info = job_state.get_current_benchmark_run_info()
        if not benchmark_run_info:
            return
        function(job_state, *args, **kwargs)

    return decorated_function


class ProfilingJobState(JobState):
    """
    Helper class for control Remote Profiling Job state in Job subject and observers
    """

    def __init__(self, num_benchmark_runs: int, model_path: str, job_id: int):
        super().__init__(progress=0, status=StatusEnum.running)
        self.job_id = job_id
        self.benchmark_runs_info: List[SingleProfilingRunInfo] = []
        self.num_benchmark_runs = num_benchmark_runs
        self.model_path = model_path
        self.started_timestamp = datetime.utcnow()

    def new_benchmark_app_run(self, batch: int, num_streams: int):
        self.benchmark_runs_info.append(SingleProfilingRunInfo(batch, num_streams, self.model_path))

    @check_benchmark_run_info
    def set_batch_streams(self, batch: int, streams: int):
        benchmark_run_info = self.get_current_benchmark_run_info()
        benchmark_run_info.batch = batch
        benchmark_run_info.num_stream = streams

    @check_benchmark_run_info
    def set_latency(self, latency: float):
        benchmark_run_info = self.get_current_benchmark_run_info()
        benchmark_run_info.latency = latency

    @check_benchmark_run_info
    def set_throughput(self, throughput: float):
        benchmark_run_info = self.get_current_benchmark_run_info()
        benchmark_run_info.throughput = throughput

    @check_benchmark_run_info
    def set_total_execution_time(self, total_execution_time: float):
        benchmark_run_info = self.get_current_benchmark_run_info()
        benchmark_run_info.total_execution_time = total_execution_time

    @check_benchmark_run_info
    def set_execution_graph(self, execution_graph: str):
        benchmark_run_info = self.get_current_benchmark_run_info()
        benchmark_run_info.exec_graph = execution_graph

    def get_current_benchmark_run_info(self) -> Optional[SingleProfilingRunInfo]:
        return self.benchmark_runs_info[-1] if self.benchmark_runs_info else None

    @check_benchmark_run_info
    @calc_job_aggregated_progress_and_status
    def update_current_benchmark_run_info(self, log: str = None,
                                          status: StatusEnum = None,
                                          progress: int = None, error_message: str = None):
        benchmark_run_info = self.get_current_benchmark_run_info()
        if error_message:
            status = StatusEnum.error
        benchmark_run_info.update(log, status, progress, error_message)

    @check_benchmark_run_info
    @calc_job_aggregated_progress_and_status
    def successfully_finish_current_stage(self):
        benchmark_run_info = self.get_current_benchmark_run_info()
        benchmark_run_info.update(status=StatusEnum.ready, progress=100)


class ProfilingJobStateSubject(JobStateSubject):
    def __init__(self, job_id: int, num_single_inferences: int, model_path: str):
        super().__init__(job_id)
        self._subject_state = ProfilingJobState(num_single_inferences, model_path, self.job_id)

    @notify_decorator
    def new_benchmark_app_run(self, batch: int, num_streams: int):
        self._subject_state.new_benchmark_app_run(batch, num_streams)

    @notify_decorator
    def update_state(self, log: str = None, status: StatusEnum = None,
                     progress: float = None, error_message: str = None, warning_message: str = None):
        self._subject_state.status = status or self._subject_state.status
        self._subject_state.progress = progress or self._subject_state.progress
        self._subject_state.error_message = error_message or self._subject_state.error_message
        self._subject_state.log = log or self._subject_state.log
        if status in (StatusEnum.cancelled, StatusEnum.cancelled):
            # Update status of current benchmark app run
            self._subject_state.update_current_benchmark_run_info(log=log, status=status, progress=progress,
                                                                  error_message=error_message)

    @notify_decorator
    def update_current_stage_state(self, log: str = None, status: StatusEnum = None,
                                   progress: float = None, error_message: str = None):
        self._subject_state.update_current_benchmark_run_info(log=log, status=status, progress=progress,
                                                              error_message=error_message)

    @notify_decorator
    def set_batch_streams(self, batch: int, streams: int):
        self._subject_state.set_batch_streams(batch=batch, streams=streams)

    @notify_decorator
    def set_latency(self, latency: float):
        self._subject_state.set_latency(latency)

    @notify_decorator
    def set_throughput(self, throughput: float):
        self._subject_state.set_throughput(throughput)

    @notify_decorator
    def set_total_execution_time(self, total_execution_time: float):
        self._subject_state.set_total_execution_time(total_execution_time)

    @notify_decorator
    def set_execution_graph(self, execution_graph: str):
        self._subject_state.set_execution_graph(execution_graph)

    @notify_decorator
    def successfully_finish_current_stage(self):
        self._subject_state.successfully_finish_current_stage()
