"""
 OpenVINO DL Workbench
 Classes for presentation data of single inference

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
from datetime import datetime
from typing import List

from wb.main.enumerates import StatusEnum
from wb.utils.benchmark_report.benchmark_report import BenchmarkReport
from wb.utils.per_layer_report.per_layer_report import PerLayerReport


class SingleProfilingRunStatus:
    def __init__(self):
        self.log: List[str] = []
        self.error: List[str] = []
        self.progress: float = 0
        self.status: StatusEnum = StatusEnum.running
        self.start_time: datetime = datetime.utcnow()


class SingleProfilingRunInfo:
    """
    Class for storing information about single profiling
    """

    def __init__(self, batch: int = None, num_stream: int = None, model_path: str = None):
        self.batch = batch
        self.num_stream = num_stream
        self._status = SingleProfilingRunStatus()
        self.model_path = model_path
        self.latency = None
        self.throughput = None
        self.total_execution_time = None
        self._execution_graph = None
        self._per_layer_report = None
        self.is_auto_benchmark = self.batch == 0 and self.num_stream == 0

    def update(self, log: str = None, status: StatusEnum = None,
               progress: int = None, error_message: str = None):
        if log:
            self._status.log.append(log)
        self._status.progress = progress or self._status.progress
        self._status.status = status or self._status.status
        if error_message:
            self._status.error = error_message
            self._status.status = StatusEnum.error

    def fill_from_report(self, report: BenchmarkReport):
        self.batch = report.batch
        self.num_stream = report.streams
        self.latency = report.latency
        self.throughput = report.throughput
        self.total_execution_time = report.total_exec_time

    @property
    def exec_graph(self) -> str:
        return self._execution_graph

    @exec_graph.setter
    def exec_graph(self, execution_graph: str):
        self._execution_graph = execution_graph
        with open(self.model_path) as original_graph_file:
            original_graph = original_graph_file.read()
        self._per_layer_report = PerLayerReport(original_graph=original_graph,
                                                exec_graph=execution_graph)

    @property
    def per_layer_report(self) -> list:
        return self._per_layer_report.json() if self._per_layer_report else []

    @property
    def layer_distribution(self) -> list:
        return self._per_layer_report.layer_time_precision_distribution() if self._per_layer_report else []

    @property
    def precision_info(self) -> tuple:
        return self._per_layer_report.runtime_precision_info() if self._per_layer_report else (None, None)

    @property
    def progress(self) -> float:
        return self._status.progress

    @property
    def status(self) -> StatusEnum:
        return self._status.status

    @property
    def start_time(self) -> datetime:
        return self._status.start_time

    @property
    def runtime_analysis_available(self) -> bool:
        return self._per_layer_report.has_runtime_precision_info() if self._per_layer_report else False
