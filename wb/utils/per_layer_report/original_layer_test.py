"""
Tests for OriginalLayer
"""
from defusedxml import ElementTree as ET

from wb.utils.per_layer_report.original_layer import OriginalLayer


def get_test_layer() -> str:
    return '''
    <layer name="data" type="Convolution">
    <data {}/>
    </layer>
    '''


def test_parse_spatial_merged_parameters():
    data = {
        'dilations': '1,1', 'kernel': '3,3',
        'pads_begin': '1,1', 'pads_end': '1,1',
        'stride_x': '1', 'stride_y': '2',
        'pad-x': '3', 'pad-y': '4',
        'test_param': 'test_value',
    }
    expected_params = {
        'spatialParams': {
            'dilations': [1, 1], 'kernel': [3, 3],
            'pads_begin': [1, 1], 'pads_end': [1, 1],
            'stride_x': 1, 'stride_y': 2, 'pad-x': 3, 'pad-y': 4,
        },
        'specificParams': {
            'test_param': 'test_value',
        },
    }
    test_layer = (
        get_test_layer().format(' '.join('{key}="{val}"'.format(key=key, val=val) for key, val in data.items()))
    )
    root = ET.fromstring(test_layer)
    layer = OriginalLayer(root)
    actual = layer.params

    assert expected_params == actual  # nosec: assert_used


def test_parse_blobs_information():
    expected_data = {
        'attribs.weights.offset': 0,
        'attribs.weights.size': 1,
        'attribs.biases.offset': 2,
        'attribs.biases.size': 3,
    }
    test_layer = '''
    <layer id="1" name="conv1" precision="FP32" type="Convolution">
        <blobs>
            <weights offset="{w_offset}" size="{w_size}"/>
            <biases offset="{b_offset}" size="{b_size}"/>
        </blobs>
    </layer>
    '''.format(w_offset=expected_data['attribs.weights.offset'],
               w_size=expected_data['attribs.weights.size'],
               b_offset=expected_data['attribs.biases.offset'],
               b_size=expected_data['attribs.biases.size'])
    root = ET.fromstring(test_layer)
    layer = OriginalLayer(root)
    assert expected_data == layer.blob_data  # nosec: assert_used
