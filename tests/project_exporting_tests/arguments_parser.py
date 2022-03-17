import argparse


def parse_arguments():
    parser = argparse.ArgumentParser()

    parser.add_argument('--exported-projects-paths',
                        required=True,
                        help='path to the .json containing paths to the exported archives.')

    parser.add_argument('--target-dir',
                        required=True,
                        help='path to the directory where exported project archives will be uncompressed.')

    args = parser.parse_args()

    return args
