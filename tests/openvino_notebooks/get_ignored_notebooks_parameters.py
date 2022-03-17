import argparse
import json


def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('--skip-list',
                        type=str)
    return parser.parse_args()


if __name__ == '__main__':
    params = parse_arguments()
    with open(params.skip_list) as file:
        notebooks = json.load(file)
    print(' '.join([f'--ignore {notebook}' for notebook in notebooks]))
