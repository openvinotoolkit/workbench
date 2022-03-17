import argparse


def parse_arguments():
    parser = argparse.ArgumentParser()

    parser.add_argument('--inference-report-path',
                        required=True,
                        help='path to the .csv inference report')

    args = parser.parse_args()

    return args

