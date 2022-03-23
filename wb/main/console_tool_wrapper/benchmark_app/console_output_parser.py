"""
 OpenVINO DL Workbench
 Class for parse output of the script for setup remote target

 Copyright (c) 2018 Intel Corporation

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
import re

from wb.error.job_error import ProfilingError
from wb.main.console_tool_wrapper.benchmark_app.stages import BenchmarkAppStages
from wb.main.jobs.profiling.profiling_job_state import ProfilingJobStateSubject
from wb.main.jobs.tools_runner.console_output_parser import ConsoleToolOutputParser, skip_empty_line_decorator


class BenchmarkConsoleOutputParser(ConsoleToolOutputParser):
    _job_state_subject: ProfilingJobStateSubject

    def __init__(self, job_state_subject: ProfilingJobStateSubject):
        super().__init__(job_state_subject=job_state_subject, stage_types=BenchmarkAppStages.get_stages())
        self.result_tag_prefix = r'\[RESULTS\] '
        self.error_pattern = re.compile(r'\[\s*ERROR\s*\]\*')
        self._new_stage_pattern = re.compile(r'\[NEW STAGE\] (?P<batch>\d+);(?P<streams>\d+)$')

        self._success_stage_pattern = re.compile(rf'\[STAGE SUCCESS\]$')
        self._batch_streams_pattern = re.compile(
            rf'{self.result_tag_prefix}\[BATCH;STREAMS\] (?P<batch>\d+);(?P<streams>\d+)$')
        self._latency_pattern = re.compile(rf'{self.result_tag_prefix}\[LATENCY\] (\d+.?\d+)$')
        self._throughput_pattern = re.compile(rf'{self.result_tag_prefix}\[THROUGHPUT\] (\d+.?\d+)$')
        self._total_execution_time = re.compile(rf'{self.result_tag_prefix}\[TOTAL EXECUTION TIME\] (\d+.?(\d+)?)$')
        self._exec_graph_pattern = re.compile(
            rf'{self.result_tag_prefix}\[EXECUTION GRAPH\] (?:<\?xml.*\?>)?(<net.*/net>)')

    @skip_empty_line_decorator
    def parse(self, string: str):
        if self.error_pattern.search(string):
            self._job_state_subject.update_state(error_message=string)
            raise ProfilingError(string, self._job_state_subject.job_id)
        is_new_stage = self._new_stage_pattern.search(string)
        if is_new_stage:
            batch = int(is_new_stage.group('batch'))
            streams = int(is_new_stage.group('streams'))
            self._job_state_subject.new_benchmark_app_run(batch, streams)
            return
        is_log_batch_streams = self._batch_streams_pattern.search(string)
        if is_log_batch_streams:
            batch = int(is_log_batch_streams.group('batch'))
            streams = int(is_log_batch_streams.group('streams'))
            self._job_state_subject.set_batch_streams(batch=batch, streams=streams)
            return
        is_log_latency = self._latency_pattern.search(string)
        if is_log_latency:
            latency = float(is_log_latency.group(1))
            self._job_state_subject.set_latency(latency)
            return
        is_log_throughput = self._throughput_pattern.search(string)
        if is_log_throughput:
            throughput = float(is_log_throughput.group(1))
            self._job_state_subject.set_throughput(throughput)
            return
        is_total_execution_time = self._total_execution_time.search(string)
        if is_total_execution_time:
            total_execution_time = float(is_total_execution_time.group(1))
            self._job_state_subject.set_total_execution_time(total_execution_time)
            return
        is_log_execution_graph = self._exec_graph_pattern.search(string)
        if is_log_execution_graph:
            execution_graph = is_log_execution_graph.group(1)
            self._job_state_subject.set_execution_graph(execution_graph)
            return
        if self._success_stage_pattern.search(string):
            self._job_state_subject.successfully_finish_current_stage()
            return
        for stage in self.stage_types:
            pattern = re.compile(r'.*'.join(stage.split()))
            if pattern.search(string):
                weight = BenchmarkAppStages.get_weight_for_stage(stage)
                self._job_state_subject.update_current_stage_state(log=string, progress=100 * weight)
                break
