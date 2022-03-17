from argparse import Namespace, ArgumentParser


def parse_arguments() -> Namespace:
    parser: ArgumentParser = ArgumentParser()

    parser.add_argument('--per-layer-report-path',
                        required=True,
                        help='path to the .csv per-layer report')

    return parser.parse_args()
