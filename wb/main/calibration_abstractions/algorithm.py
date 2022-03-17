"""
 OpenVINO DL Workbench
 Class for algorithm abstraction in the calibration config

 Copyright (c) 2018-2019 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
