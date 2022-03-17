import json
from pathlib import Path
from typing import List

from benchmark_performance_report import BenchmarkPerformanceReport, CLIExperiment, BenchmarkInference
from benchmark_tool_runner import BenchmarkToolRunner


class BenchmarkPerformanceReportDumper:
    _report_file_path: str
    _report: BenchmarkPerformanceReport

    def __init__(self, report: BenchmarkPerformanceReport, report_file_path: str):
        self._report_file_path = report_file_path
        self._report = report

    def _run_cli_experiment(self, batch: int, streams: int) -> CLIExperiment:
        cli_experiment = CLIExperiment(batch=batch, streams=streams)
        benchmark_tool_runner = BenchmarkToolRunner(batch=batch, streams=streams,
                                                    model_xml_path=self._report.config.model_xml_path,
                                                    dataset_path=self._report.config.dataset_path,
                                                    device=self._report.config.device_name,
                                                    inference_time=self._report.config.inference_time)
        cli_inferences: List[BenchmarkInference] = []
        for _ in range(self._report.config.experiments_number):
            throughput = benchmark_tool_runner.get_result()
            inference = BenchmarkInference(batch=batch, streams=streams, throughput=throughput)
            cli_inferences.append(inference)
        cli_experiment.inferences = cli_inferences
        return cli_experiment

    def _collect_cli_experiments(self) -> List[CLIExperiment]:
        cli_experiments: List[CLIExperiment] = []
        for batch, streams in self._report.config.experiments:
            experiment = self._run_cli_experiment(batch=batch, streams=streams)
            cli_experiments.append(experiment)
        return cli_experiments

    def _dump_report_file(self, content: dict):
        _report_file_path = Path(self._report_file_path)
        _report_file_path.touch(exist_ok=True)
        with _report_file_path.open('w') as report_file:
            json.dump(content, report_file, sort_keys=False, indent=2)

    def create_report(self):
        cli_experiments = self._collect_cli_experiments()
        self._report.add_cli_experiments(experiments=cli_experiments)
        report_dict = self._report.to_dict()
        self._dump_report_file(content=report_dict)
