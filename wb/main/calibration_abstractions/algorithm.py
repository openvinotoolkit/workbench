"""
 OpenVINO DL Workbench
 Class for algorithm abstraction in the calibration config

 Copyright (c) 2018-2019 Intel Corporation

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
from wb.main.models.enumerates import QuantizationAlgorithmEnum, QuantizationAlgorithmPresetEnum


class DefaultParams:
    """
    Abstraction for parameters of the Default Quantization Algorithm:
    "params": {
        // A preset is a collection of optimization algorithm parameters
        // that will specify to the algorithm to improve which metric
        // the algorithm needs to concentrate. Each optimization algorithm
        // supports [performance, accuracy, mixed] presets
        "preset": "accuracy",
        "stat_subset_size": 100, // Size of subset to calculate activations statistics that can be used
                                       // for quantization parameters calculation.
    }
    """

    def __init__(self, preset: QuantizationAlgorithmPresetEnum, stat_subset_size: int):
        self.preset = preset.value
        self.stat_subset_size = stat_subset_size

    def json(self):
        return {
            'preset': self.preset,
            'stat_subset_size': self.stat_subset_size
        }


class AccuracyAwareParams(DefaultParams):
    """
    Abstraction for parameters of the Accuracy Aware Quantization Algorithm:
    "params": {
        // A preset is a collection of optimization algorithm parameters
        // that will specify to the algorithm to improve which metric
        // the algorithm needs to concentrate. Each optimization algorithm
        // supports [performance, accuracy, mixed] presets
        "preset": "accuracy",
        "stat_subset_size": 100, // Size of subset to calculate activations statistics that can be used
                                       // for quantization parameters calculation.
        "metric_name": "accuracy@top1", // Accuracy metric name
        "maximal_drop": 0.001, // Maximal accuracy Drop
        "metric_subset_ratio": 100, // Size of subset to calculate metric
    }
    """

    def __init__(self, preset: QuantizationAlgorithmPresetEnum, stat_subset_size: int, maximal_drop: str,
                 metric_subset_ratio: int,
                 base_algorithm: str = 'DefaultQuantization'):
        super().__init__(preset, stat_subset_size)
        self.ranking_subset_size = stat_subset_size
        self.maximal_drop = maximal_drop
        self.metric_subset_ratio = metric_subset_ratio
        self.base_algorithm = base_algorithm

    def json(self):
        return {
            **super().json(),
            'maximal_drop': self.maximal_drop,
            'metric_subset_ratio': self.metric_subset_ratio,
            'base_algorithm': self.base_algorithm,
            'ranking_subset_size': self.ranking_subset_size,
        }


class QuantizationAlgorithm:
    """
    Abstraction for Quantization Algorithm:
    "algorithms": [
        {
        "name": "DefaultQuantization", // compression algorithm name
        "params": DefaultParams // parameters
        }
    ]
    """

    def __init__(self, name: QuantizationAlgorithmEnum = QuantizationAlgorithmEnum.default,
                 params: DefaultParams = None):
        self.name = name.value
        self.params = params

    def json(self) -> dict:
        return {
            'name': self.name,
            'params': self.params.json() if self.params is not None else {},
        }
