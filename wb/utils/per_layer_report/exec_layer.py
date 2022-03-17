"""
 OpenVINO DL Workbench
 Class for handling layer from execution graph

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
from typing import List
from defusedxml import ElementTree

from wb.utils.per_layer_report.layer import Layer
from wb.utils.per_layer_report.original_layer import OriginalLayer


class ExecLayer(Layer):
    def __init__(self, xml_layer: ElementTree, all_original_layers_names: List[str]):
        super().__init__(xml_layer)
        data = xml_layer.find('data')
        if data is None:
            return
        data = data.attrib
        original_layers_names = data['originalLayersNames'].split(',') if data['originalLayersNames'] else []
        self.original_layers_names = self.get_original_layers_names(original_layers_names, all_original_layers_names)
        self.layer_name_b = None
        self.delta = None
        self.exec_time = [
            self.prepare_exec_time(data['execTimeMcs'])
        ]
        self.output_precisions = list({
            precision for precision in data['outputPrecisions'].split(',')
        })
        self.runtime_precision = data.get('runtimePrecision')
        self.exec_order = data.get('execOrder')
        self.details = self.details_from_xml(xml_layer)
        self.fused_layers = []
        self.split_executed_layers = []

    @staticmethod
    def prepare_exec_time(exc_time: str):
        try:
            return float(exc_time) / 1000
        except ValueError:
            return exc_time

    @staticmethod
    def details_from_xml(xml_layer: ElementTree):
        details = {
            'positionalData': ExecLayer.positional_data_from_xml(xml_layer),
            'executionParams': ExecLayer.execution_params_from_xml(xml_layer)
        }
        return details

    @staticmethod
    def execution_params_from_xml(xml_layer: ElementTree):
        execution_params = ExecLayer.data_params_from_xml(xml_layer)
        del execution_params['originalLayersNames']
        return execution_params

    def json(self):
        return {
            **super().json(),
            'layerNameB': self.layer_name_b,
            'delta': self.delta,
            'outputPrecisions': self.output_precisions,
            'runtimePrecision': self.runtime_precision,
            'execTime': self.exec_time,
            'details': [self.details_to_json(), ]
        }

    def details_to_json(self) -> dict:
        result = self.details
        result['fusedLayers'] = [fused_layer.json() for fused_layer in self.fused_layers]

        if self.split_executed_layers:
            result['splitExecutedLayers'] = self.split_executed_layers
        return result

    @staticmethod
    def get_original_layers_names(original_layers_names: List[str],
                                  all_original_layers_names: List[str]) -> list:
        return list(set(original_layers_names).intersection(all_original_layers_names))

    def fill_fused_layers(self, original_layers: List[OriginalLayer], execution_layers: List['ExecLayer']):
        split_executed_layers = list(
            filter(
                self.original_layers_names_are_equal,
                execution_layers
            )
        )
        ir_layers = list(
            filter(
                lambda layer: layer.layer_name in self.original_layers_names,
                original_layers
            )
        )
        self.fused_layers.extend(ir_layers)
        self.split_executed_layers.extend([layer.layer_name for layer in split_executed_layers])

    @property
    def exec_time_to_number(self):
        return [exec_time for exec_time in self.exec_time if not isinstance(exec_time, str)]

    def original_layers_names_are_equal(self, layer) -> bool:
        return self.original_layers_names and set(self.original_layers_names) == set(layer.original_layers_names)
