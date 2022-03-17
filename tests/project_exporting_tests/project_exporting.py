import json
import os
import shutil

from arguments_parser import parse_arguments

REFERENCE_PROJECT_INFORMATION = {
    # 74913
    # 'SQUEEZENET': {
    #     'archive_structure': {
    #         'has_model': True,
    #         'has_dataset': True,
    #         'has_description': True,
    #         'has_configs': False,
    #         'has_accuracy_config': False,
    #         'has_calibration_config': False
    #     },
    #     'description': {
    #         'Model': 'Squeezenet_V1.1_IR_V10',
    #         'Dataset': 'ImageNetDataset',
    #         'Optimized with INT8 Calibration': 'No',
    #         'Best result batch configuration': '1',
    #         'Best result stream configuration': ('1', '4'),
    #         'Accuracy Checker version': '0.9.0',
    #         'Post-training Optimisation Tool version': '1.0'
    #     }
    # },
    # 74090
    # 'MOBILENET': {
    #     'archive_structure': {
    #         'has_model': True,
    #         'has_dataset': True,
    #         'has_configs': True,
    #         'has_description': True,
    #         'has_accuracy_config': True,
    #         'has_calibration_config': True
    #     },
    #     'description': {
    #         'Model': 'Mobilenet',
    #         'Dataset': 'SmallVOCDataset',
    #         'Optimized with INT8 Calibration': 'Yes',
    #         'Best result batch configuration': '1',
    #         'Best result stream configuration': ('1', '4'),
    #         'Accuracy Checker version': '0.9.0',
    #         'Post-training Optimisation Tool version': '1.0'
    #     }
    # },
    # 'RESNET': {
    #     'archive_structure': {
    #         'has_model': True,
    #         'has_dataset': True,
    #         'has_configs': True,
    #         'has_description': True,
    #         'has_accuracy_config': True,
    #         'has_calibration_config': False
    #     },
    #     'description': {
    #         'Model': 'resnet-50-caffe2',
    #         'Dataset': 'ImageNetDataset',
    #         'Optimized with INT8 Calibration': 'No',
    #         'Best result batch configuration': '1',
    #         'Best result stream configuration': ('1', '4'),
    #         'Accuracy Checker version': '0.9.0',
    #         'Post-training Optimisation Tool version': '1.0'
    #     }
    # }
}


def get_project_info(project_name: str, path_to_archive: str, target_dir: str):
    project_info = {}

    # Unpacking project to the dedicated dir
    project_dir = os.path.join(target_dir, project_name)
    os.mkdir(project_dir)
    shutil.unpack_archive(path_to_archive, project_dir)

    # Getting file and directory presence
    project_files = os.listdir(project_dir)
    project_info['has_model'] = 'model' in project_files
    project_info['has_dataset'] = 'dataset' in project_files
    project_info['has_configs'] = 'configs' in project_files
    project_info['has_description'] = 'description.txt' in project_files
    project_info['has_accuracy_config'] = os.path.exists(os.path.join(project_dir,
                                                                      'configs',
                                                                      'accuracy_config.yml'))
    project_info['has_calibration_config'] = os.path.exists(os.path.join(project_dir,
                                                                         'configs',
                                                                         'calibration_config.json'))
    return project_info


def parse_description(path_to_description: str) -> dict:
    parsed_description = {}

    with open(path_to_description, 'r', encoding='utf-8') as description:
        description = description.read().split('\n')

        if '' in description:
            description.remove('')

        for line in description:
            attribute = line.split(':')[0].strip()
            attribute_value = line.split(':')[1].strip()

            parsed_description[attribute] = attribute_value

        return parsed_description


def check_project_description(reference_description: dict, actual_description: dict):
    constant_attributes = ['Model', 'Dataset', 'Device type', 'Optimized with INT8 Calibration',
                           'Best result batch configuration', 'Best result stream configuration',
                           'Accuracy Checker version', 'Post-training Optimisation Tool version']

    all_attributes = constant_attributes + ['Device name', 'Target',
                                            'Corresponding latency', 'Best result FPS', 'Accuracy',
                                            'DL Workbench version']

    for attribute in all_attributes:
        if attribute not in actual_description and (attribute == 'Accuracy' and attribute in reference_description):
            raise KeyError('{} is not present in actual description'.format(attribute))

    for attribute_name, attribute_value in actual_description.items():
        if attribute_name in constant_attributes:
            reference_attribute_value = reference_description[attribute_name]
            assertion_failed_message = f'{attribute_name} are not equal. ' \
                                       f'Reference Value: {reference_attribute_value}, Actual Value: {attribute_value}'
            if attribute_name == 'Best result stream configuration':
                assert attribute_value in reference_attribute_value, assertion_failed_message
            else:
                assert attribute_value == reference_attribute_value, assertion_failed_message
        elif attribute_name == 'Device':
            assert ('Intel' in attribute_value and 'CPU' in attribute_value), 'Unknown device: {}'. \
                format(attribute_value)
        elif attribute_name == 'Target':
            assert 'Local Workstation' in attribute_value, 'Unknown target machine: {}'.format(attribute_value)
        elif attribute_name in ['Corresponding latency', 'Best result FPS', 'Accuracy']:
            assert float(attribute_value) > 0, 'Invalid {} value: {}'.format(attribute_name, attribute_value)
        elif attribute_name == 'DL Workbench version':
            assert len(attribute_value), 'No version info: {}'.format(attribute_value)
        else:
            raise KeyError(f'Unknown key: {attribute_name} found in actual description')


def check_exported_project_structure(reference_information: dict, actual_information: dict):
    for key in reference_information:
        assert actual_information[key] == reference_information[key], \
            '{} are not equal. Reference Value: {}, Actual Value: {}'.format(key,
                                                                             reference_information[key],
                                                                             actual_information[key])


if __name__ == '__main__':
    args = parse_arguments()

    with open(args.exported_projects_paths, 'r', encoding='utf-8') as project_paths_file:
        project_paths: dict = json.load(project_paths_file)

        for project, reference_info in REFERENCE_PROJECT_INFORMATION.items():
            print('CHECKING EXPORTED PROJECT STRUCTURE: {}'.format(project))

            actual_project_structure: dict = get_project_info(project, project_paths[project], args.target_dir)
            check_exported_project_structure(reference_info['archive_structure'], actual_project_structure)

            print('CHECKING EXPORTED PROJECT DESCRIPTION: {}'.format(project))
            path_to_project_description = os.path.join(args.target_dir, project, 'description.txt')
            actual_project_description: dict = parse_description(path_to_project_description)
            check_project_description(reference_info['description'], actual_project_description)

    exit(0)
