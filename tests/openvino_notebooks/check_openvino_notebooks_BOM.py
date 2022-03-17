import argparse
import json
import sys
from pathlib import Path


def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('--skip-list-file-path',
                        type=Path)
    parser.add_argument('--check-path',
                        type=Path)
    parser.add_argument('--source-path',
                        type=Path)
    return parser.parse_args()


if __name__ == '__main__':
    params = parse_arguments()

    bom_root_dir: Path = params.check_path.resolve()
    dir_list = [str(directory).replace(f'{bom_root_dir.resolve()}/', '')
                for directory in params.check_path.glob('*/*.ipynb')]

    source_root_dir: Path = params.source_path.resolve()
    source_list = [f'{directory.parent.name}/{directory.name}'
                   for directory in params.source_path.glob('*/*.ipynb')]

    with open(params.skip_list_file_path) as file:
        skip_list = json.load(file)

    unexpected_notebooks = [notebook for notebook in dir_list
                            if notebook in skip_list or Path(notebook).name in skip_list]
    unexpected_notebooks_str = ' '.join(unexpected_notebooks)

    missed_notebooks = [notebook for notebook in source_list
                        if notebook not in dir_list
                        and (notebook not in skip_list
                             and str(Path(notebook).name) not in skip_list
                             and str(Path(notebook).parent) not in skip_list)]

    if unexpected_notebooks:
        print(f'Notebooks {unexpected_notebooks_str} should not be in the image as they are in the skip list')
    if missed_notebooks:
        print(f'Notebooks: {missed_notebooks} are missing in the image')
    if unexpected_notebooks or missed_notebooks:
        sys.exit(1)
