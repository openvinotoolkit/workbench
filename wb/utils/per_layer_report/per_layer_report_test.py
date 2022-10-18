"""
Tests for RuntimeRepresentationReport
"""
import os
import json
from pathlib import Path

from parameterized import parameterized

from wb.main.utils.utils import find_by_ext
from wb.utils.per_layer_report.per_layer_report import PerLayerReport


def generate_tests(models_path: str):
    ppath = Path(models_path)
    result = []
    for path in ppath.glob('**/*'):
        if not path.is_dir():
            continue
        xml_exist = any(fname.endswith('.xml') for fname in os.listdir(str(path)))
        bin_exist = any(fname.endswith('.bin') for fname in os.listdir(str(path)))
        if xml_exist and bin_exist:
            for device in ['CPU', 'VPU', 'GPU']:
                if any(fname.startswith(device.lower()) for fname in os.listdir(str(path))):
                    result.append([str(path), device])
    return result


class TestRuntimeRepresentationReport:
    resource_dir = os.environ['RESOURCES_PATH']
    models_dir = os.path.join(resource_dir, 'models', 'IR')

    @staticmethod
    def construct_paths(model_path: str, device: str):
        device_runtime_repr_path =  os.path.join(model_path, f'{device.lower()}_runtime_repr')
        exec_graph_path = find_by_ext(device_runtime_repr_path, 'xml')
        model_name = Path(exec_graph_path).stem.replace('_exec_graph', '')
        ir_path = os.path.join(model_path, f'{model_name}.xml')
        repr_report_path = os.path.join(device_runtime_repr_path, 'runtime_report.json')
        return ir_path, exec_graph_path, repr_report_path


    @staticmethod
    def assert_list_of_layers_equal(expected_layers: list, actual_layers: list):
        expected_layers_names = {layer['layerName'] for layer in expected_layers}
        actual_layers_names = {layer['layerName'] for layer in actual_layers}
        assert expected_layers_names == actual_layers_names  # nosec: assert_used
        for actual_layer in actual_layers:
            actual_layer_name = actual_layer['layerName']
            expected_layer = list(
                filter(lambda layer, layer_name=actual_layer_name: layer['layerName'] == layer_name, expected_layers))
            assert len(expected_layer) == 1  # nosec: assert_used
            expected_layer = expected_layer[0]
            assert actual_layer == expected_layer  # nosec: assert_used

    def assert_runtime_representation(self, model, device):
        ir_dir, exec_dir, repr_report = self.construct_paths(model, device)
        runtime_repr = PerLayerReport.from_files(ir_dir, exec_dir)
        actual = runtime_repr.json()
        with open(repr_report) as file_stream:
            expected = json.load(file_stream, parse_float=float, parse_int=int)
        self.assert_list_of_layers_equal(expected, actual)

    @parameterized.expand(generate_tests(models_dir))
    def test_inception_runtime_representation(self, model_path, device):
        self.assert_runtime_representation(model_path, device)
