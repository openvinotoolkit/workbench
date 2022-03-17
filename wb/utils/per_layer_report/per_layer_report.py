"""
 OpenVINO DL Workbench
 Class for handling runtime representation reports from benchmark application

 Copyright (c) 2018 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""

from typing import List, Tuple

from defusedxml import ElementTree

from config.constants import PRECISION_TO_CLIENT_REPRESENTATION
from wb.main.enumerates import ModelPrecisionEnum
from wb.utils.per_layer_report.exec_layer import ExecLayer
from wb.utils.per_layer_report.layer import Layer
from wb.utils.per_layer_report.original_layer import OriginalLayer


class PrecisionTransition:
    def __init__(self, base_precision: str, all_precisions: Tuple[str]):
        self.base_precision = base_precision
        self.transitions_info = {precision: 0 for precision in all_precisions if precision != self.base_precision}
        self._execution_time = 0

    def increment_transition_to(self, res_precision: ModelPrecisionEnum):
        self.transitions_info[res_precision] += 1

    def add_execution_time(self, execution_time: int):
        self._execution_time += execution_time

    @property
    def precision_distribution(self) -> dict:
        return {
            'precision': self.base_precision,
            'transitions': sum(self.transitions_info[to_precision] for to_precision in self.transitions_info),
            'execTime': self._execution_time
        }


class RuntimePrecisionInfo:
    def __init__(self, precisions: Tuple[str, ...]):
        self.transitions = {precision: PrecisionTransition(precision, precisions) for precision in precisions}

    def fill_runtime_precision_info(self, execution_layers: List[ExecLayer]):
        executed_layers = filter(lambda executed_layer: sum(executed_layer.exec_time_to_number) > 0,
                                 execution_layers)
        sorted_executed_layers = sorted(executed_layers, key=lambda executed_layer: executed_layer.exec_order)

        first_executed_layer = sorted_executed_layers[0]
        current_precision = PRECISION_TO_CLIENT_REPRESENTATION[
            first_executed_layer.runtime_precision] if first_executed_layer.runtime_precision else None

        for execution_layer in sorted_executed_layers:
            execution_layer_precision = PRECISION_TO_CLIENT_REPRESENTATION[
                execution_layer.runtime_precision] if execution_layer.runtime_precision else None

            if not execution_layer_precision:
                continue
            precision_transition_info = self.transitions[current_precision]
            precision_transition_info.add_execution_time(sum(execution_layer.exec_time_to_number))

            if current_precision != execution_layer_precision:
                precision_transition_info.increment_transition_to(execution_layer_precision)
                current_precision = execution_layer_precision

    @property
    def precision_distribution(self) -> dict:
        distribution = {}
        for precision in self.transitions.keys():
            distribution[precision] = self.transitions[precision].precision_distribution
        return distribution

    @property
    def precision_transitions(self) -> dict:
        transitions = {}
        for precision in self.transitions.keys():
            transitions[precision] = self.transitions[precision].transitions_info
        return transitions


class PerLayerReport:
    def __init__(self, original_graph: str, exec_graph: str = None):

        self.content = exec_graph

        execution_network = ElementTree.fromstring(self.content)

        original_network = ElementTree.fromstring(original_graph)

        self.original_layers = self.parse_layers(original_network, OriginalLayer)
        all_original_layers_names = [layer.layer_name for layer in self.original_layers]
        self.execution_layers = self.parse_layers(execution_network, ExecLayer, all_original_layers_names)

        self.connect_fused_split_layers()

    @staticmethod
    def from_files(path_to_original_graph: str, path_to_execution_graph: str = None) -> 'PerLayerReport':
        with open(path_to_original_graph) as original_graph_file:
            original_graph = original_graph_file.read()

        with open(path_to_execution_graph) as execution_graph_file:
            execution_graph = execution_graph_file.read()
        return PerLayerReport(original_graph, execution_graph)

    def connect_fused_split_layers(self):
        for execution_layer in self.execution_layers:
            execution_layer.fill_fused_layers(self.original_layers, self.execution_layers)

    @staticmethod
    def parse_layers(network: ElementTree, layer_class: type(Layer), *args) -> List[Layer]:
        layers = []
        xml_layers = network.find('layers')
        for xml_layer in xml_layers:
            layers.append(layer_class(xml_layer, *args))
        return layers

    def json(self):
        return [layer.json() for layer in self.execution_layers]

    def layer_time_precision_distribution(self) -> list:
        result = []
        executed_layers = filter(lambda executed_layer: sum(executed_layer.exec_time_to_number) > 0,
                                 self.execution_layers)

        l_type = None
        for layer in executed_layers:
            layer_precision = PRECISION_TO_CLIENT_REPRESENTATION[
                layer.runtime_precision] if layer.runtime_precision else None
            l_type = layer.layer_type
            layer_description = next(
                filter(lambda layer_info: layer_info['layerType'] == l_type, result), None)
            if not layer_description:
                result.append({
                    'layerType': layer.layer_type,
                    'execTime': sum(layer.exec_time_to_number),
                    'total': 1,
                    'runtimePrecisions': {layer_precision: 1} if layer.runtime_precision else None
                })
                continue
            layer_description['execTime'] += sum(layer.exec_time_to_number)
            layer_description['total'] += 1
            if not layer.runtime_precision:
                continue
            if layer_description['runtimePrecisions'].get(layer_precision):
                layer_description['runtimePrecisions'][layer_precision] += 1
            else:
                layer_description['runtimePrecisions'][layer_precision] = 1
        return result

    def runtime_precision_info(self) -> tuple:
        runtime_precision_info = RuntimePrecisionInfo(
            (ModelPrecisionEnum.fp32.value, ModelPrecisionEnum.fp16.value,
             PRECISION_TO_CLIENT_REPRESENTATION[ModelPrecisionEnum.i8.value],
             PRECISION_TO_CLIENT_REPRESENTATION[ModelPrecisionEnum.i1.value]))
        runtime_precision_info.fill_runtime_precision_info(self.execution_layers)
        return runtime_precision_info.precision_distribution, runtime_precision_info.precision_transitions

    def has_runtime_precision_info(self) -> bool:
        return all(map(lambda layer: layer.runtime_precision, self.execution_layers))
