import csv
import json
import os
import sys

from arguments_parser import parse_arguments

path_to_reference_file: str = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                           'reference_layer_properties.json')

with open(path_to_reference_file, 'r', encoding='utf-8') as reference_file:
    REFERENCE_LAYER_PROPERTIES: dict = json.load(reference_file)


def check_layer_by_reference(reference_layer_data: dict, actual_layer_data: dict):
    assert actual_layer_data['name'] == reference_layer_data['name'], \
        f'Layer names do not match. REFERENCE: {reference_layer_data["name"]}. ACTUAL: {actual_layer_data["name"]}.'

    assert actual_layer_data['type'] == reference_layer_data['type'], \
        f'Layer types do not match. REFERENCE: {reference_layer_data["type"]}. ACTUAL: {actual_layer_data["type"]}.'

    assert actual_layer_data['precision'] == reference_layer_data['precision'], \
        f'Precision is not present or is not valid.\n' \
        f'REFERENCE: {reference_layer_data["precision"]}. ACTUAL: {actual_layer_data["precision"]}.'


def check_body_layer(actual_layer_data: dict, reference_precisions: list, reference_layer_types: list):
    assert actual_layer_data['name'], 'Layer name is not present.'
    assert actual_layer_data['type'] in reference_layer_types, \
        f'Layer type is not present or is not valid. ACTUAL: {actual_layer_data["type"]}'
    assert actual_layer_data['precision'] in reference_precisions, \
        f'Precision is not present or is not valid. ACTUAL: {actual_layer_data["precision"]}'


def check_per_layer_report_file(per_layer_report_path: str,
                                reference_layers_data: dict) -> int:
    with open(per_layer_report_path, 'r', encoding='utf-8') as report_file:

        data: list = report_file.read().rstrip().split('\n')

        csv_reader = csv.reader(data, delimiter=';')

        column_headers: list = next(csv_reader)

        for column in column_headers:
            assert column in ('Execution Order', 'Layer Name', 'Layer Type', 'Execution Time', 'Runtime Precision')

        for index_row, row in enumerate(csv_reader):
            exec_order, layer_name, layer_type, exec_time, precision = row

            actual_layer_data: dict = {
                'name': layer_name,
                'type': layer_type,
                'precision': precision
            }

            # Common checks
            assert int(exec_order) >= 0, f'Exec Order is not valid. ACTUAL: {exec_order}'
            assert float(exec_time) >= 0, f'Exec time is not valid. ACTUAL: {exec_time}'

            # Compare with reference for first entry
            if index_row == 0:
                check_layer_by_reference(reference_layers_data['inputLayer'], actual_layer_data)
                continue
            # Compare with reference for last entry
            # -2 as there was a `next()` for csv reader iterator
            elif index_row == len(data) - 2:
                check_layer_by_reference(reference_layers_data['outputLayer'], actual_layer_data)
                continue
            # Comparison for other layers
            check_body_layer(actual_layer_data,
                             reference_layers_data['precisions'],
                             reference_layers_data['layerTypes'])

    return 0


if __name__ == '__main__':
    args = parse_arguments()

    sys.exit(check_per_layer_report_file(args.per_layer_report_path,
                                         REFERENCE_LAYER_PROPERTIES['squeezeNet']))
