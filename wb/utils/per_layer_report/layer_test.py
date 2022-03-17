"""
Tests for Layer
"""
from defusedxml import ElementTree as ET

from wb.utils.per_layer_report.layer import Layer


def test_parse_attributes():
    test_attributes = {
        'id': 0,
        'name': 'conv2_1/sep',
        'type': 'Convolution',
        'precision': 'FP16',
    }
    test_layer = '<layer {}></layer>'.format(
        ' '.join(['{}="{}"'.format(name, val) for name, val in test_attributes.items()]))
    root = ET.fromstring(test_layer)
    layer = Layer(root)
    assert test_attributes['name'] == layer.layer_name  # nosec: assert_used
    assert test_attributes['type'] == layer.layer_type  # nosec: assert_used


def test_parse_empty_data():
    test_layer = '''
    <layer name="data" type="Input">
    </layer>
    '''
    root = ET.fromstring(test_layer)
    xml_data = Layer.data_params_from_xml(root)
    assert {} == xml_data  # nosec: assert_used


def test_data_params_from_xml():
    data = {
        'aspect_ratio': '2.0',
        'clip': '0',
        'density': '',
        'fixed_ratio': '',
        'fixed_size': '',
        'flip': '1',
    }
    test_layer = '''
    <layer name="data" type="Input">
        <data {}/>
    </layer>
    '''.format(' '.join('{key}="{val}"'.format(key=key, val=val) for key, val in data.items()))
    root = ET.fromstring(test_layer)
    xml_data = Layer.data_params_from_xml(root)
    assert data == xml_data  # nosec: assert_used


class TestParsePositionalData:
    @staticmethod
    def shape_to_xml(shape: list) -> str:
        return '\n'.join('<dim>{}</dim>'.format(dim) for dim in shape)

    @staticmethod
    def shape_from_str(string: str) -> list:
        return [int(s) for s in string.split(', ')]

    def test_parse_positional_data_only_output(self):
        test_shape = [1, 3, 384, 672]

        test_layer = '''
        <layer name="data" type="Input">
            <output><port id="0">{}</port></output>
        </layer>
        '''.format(self.shape_to_xml(test_shape))

        root = ET.fromstring(test_layer)
        positional_data = Layer.positional_data_from_xml(root)

        assert 'Input 0' not in positional_data  # nosec: assert_used
        assert len(positional_data) == 1  # nosec: assert_used
        assert self.shape_from_str(positional_data['Output 0']) == test_shape  # nosec: assert_used

    def test_parse_simple_positional_data(self):
        test_input_shape = [1, 3, 384]
        test_output_shape = [1, 3, 384, 2, 3]

        test_layer = '''
        <layer name="data" type="Convolution">
            <input><port id="0">{}</port></input>
            <output><port id="1">{}</port></output>
        </layer>
        '''.format(self.shape_to_xml(test_input_shape),
                   self.shape_to_xml(test_output_shape))

        root = ET.fromstring(test_layer)
        positional_data = Layer.positional_data_from_xml(root)

        assert len(positional_data) == 2  # nosec: assert_used
        assert self.shape_from_str(positional_data['Input 0']) == test_input_shape  # nosec: assert_used
        assert self.shape_from_str(positional_data['Output 0']) == test_output_shape  # nosec: assert_used

    def test_parse_full_positional_data(self):
        test_input1_shape = [1, ]
        test_input2_shape = [1, 2, 3, 4]
        test_output_shape = [1, 3, 9]

        test_layer = '''
        <layer name="data" type="Convolution">
            <input>
                   <port id="0">{}</port>
                   <port id="1">{}</port>
            </input>
            <output><port id="2">{}</port></output>
        </layer>
        '''.format(self.shape_to_xml(test_input1_shape),
                   self.shape_to_xml(test_input2_shape),
                   self.shape_to_xml(test_output_shape))

        root = ET.fromstring(test_layer)
        positional_data = Layer.positional_data_from_xml(root)
        assert len(positional_data) == 3 # nosec: assert_used
        assert self.shape_from_str(positional_data['Input 0']) == test_input1_shape  # nosec: assert_used
        assert self.shape_from_str(positional_data['Input 1']) == test_input2_shape  # nosec: assert_used
        assert self.shape_from_str(positional_data['Output 0']) == test_output_shape  # nosec: assert_used
