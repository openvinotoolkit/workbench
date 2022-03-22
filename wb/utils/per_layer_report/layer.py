"""
 OpenVINO DL Workbench
 Abstraction class layer

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
from defusedxml import ElementTree


class Layer:
    """
    Common abstraction for parsing, processing and storing data of a Layer.
    """

    def __init__(self, xml_layer: ElementTree):
        attributes = xml_layer.attrib
        self.layer_name = attributes['name']
        self.layer_type = attributes['type']

    @staticmethod
    def positional_data_from_xml(xml_layer: ElementTree) -> dict:
        """
        Parse positional information (inputs, outputs) of a layer
        :param xml_layer: Layer element of XML
        :return: dictionary contains information about inputs and outputs of the layer
        For example, if layer contains to inputs and one outputs the return value will be:
        {
            'Input 0': [dim0, ..., dimN],
            'Input 1': [dim0, ..., dimM],
            'Output 0': [dim0, ..., dimK],
        }
        """
        positional_data = {}

        positional_data.update(
            Layer.in_out_data_from_xml(xml_layer, 'input')
        )

        positional_data.update(
            Layer.in_out_data_from_xml(xml_layer, 'output')
        )
        return positional_data

    @staticmethod
    def in_out_data_from_xml(xml_layer: ElementTree, ports_type: str) -> dict:
        result = {}
        tag_ports = xml_layer.find(ports_type.lower())
        if not tag_ports:
            return {}
        ports = xml_layer.find(ports_type.lower()).findall('port')
        for port_id, port in enumerate(sorted(ports, key=lambda x: x.attrib['id'])):
            dims = port.findall('dim')
            input_name = '{} {}'.format(ports_type.capitalize(), port_id)
            result[input_name] = (
                ', '.join([dim.text for dim in dims])
            )
        return result

    @staticmethod
    def data_params_from_xml(xml_layer: ElementTree) -> dict:
        data = xml_layer.find('data')
        if data is None:
            return {}
        return data.attrib

    def json(self):
        return {
            'layerName': self.layer_name,
            'layerType': self.layer_type
        }
