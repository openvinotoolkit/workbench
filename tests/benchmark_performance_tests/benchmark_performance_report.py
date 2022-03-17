import statistics
from typing import List, Tuple, TypedDict


class BenchmarkPerformanceReportConfig:
    model_id: int
    model_name: str
    model_xml_path: str
    dataset_id: int
    dataset_name: int
    dataset_path: str
    device_name: str = 'CPU'
    inference_time: int = 20
    experiments_number: int = 10
    experiments: Tuple[Tuple[int, int]] = ((1, 1), (2, 2), (1, 4))

    def __init__(self, model_xml_path: str, dataset_path: str):
        self.model_xml_path = model_xml_path
        self.dataset_path = dataset_path

    def to_dict(self) -> dict:
        return {
            'model_xml_path': self.model_xml_path,
            'dataset_path': self.dataset_path,
            'device_name': self.device_name,
            'inference_time': self.inference_time,
            'experiments_number': self.experiments_number,
            'experiments': self.experiments,
        }


class BenchmarkInference(TypedDict):
    batch: int
    streams: int
    throughput: float


class CLIExperiment:
    batch: int
    streams: int
    _inferences: List = []
    average_throughput: float = None

    def __init__(self, batch: int, streams: int):
        self.batch = batch
        self.streams = streams

    class _CLIExperimentDict(TypedDict):
        batch: int
        streams: int
        inferences: List[BenchmarkInference]
        average_throughput: float

    @property
    def key(self) -> str:
        return f'b{self.batch};s{self.streams}'

    @property
    def inferences(self) -> List[BenchmarkInference]:
        return self._inferences

    @inferences.setter
    def inferences(self, inferences: List[BenchmarkInference]):
        self._inferences = inferences
        average_throughput = statistics.mean([i['throughput'] for i in inferences])
        self.average_throughput = average_throughput

    def to_dict(self) -> dict:
        return self._CLIExperimentDict(batch=self.batch, streams=self.streams, inferences=self.inferences,
                                       average_throughput=self.average_throughput)


class BenchmarkPerformanceReport:
    _default_ui_experiments_dict = {
        'experiments': {},
        'average_throughput_drop': None
    }

    config: BenchmarkPerformanceReportConfig
    cli: dict = {}
    ui: dict = {
        'local': {
            'single': _default_ui_experiments_dict,
            'group': _default_ui_experiments_dict,
        }
    }

    class _BenchmarkPerformanceReportDict(TypedDict):
        config: dict
        cli: dict
        ui: dict

    def __init__(self, config: BenchmarkPerformanceReportConfig):
        self.config = config

    def to_dict(self) -> dict:
        return self._BenchmarkPerformanceReportDict(config=self.config.to_dict(), cli=self.cli, ui=self.ui)

    def add_cli_experiments(self, experiments: List[CLIExperiment]):
        for experiment in experiments:
            self.cli[experiment.key] = experiment.to_dict()
