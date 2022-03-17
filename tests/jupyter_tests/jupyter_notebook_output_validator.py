import json
import re
import sys
from argparse import Namespace, ArgumentParser

from typing import List, Dict

# Cells with these ids should not have output but others should
CELL_IDS_WITH_NO_OUTPUT = ('set_original_ir_model_paths_code', 'set_optimized_ir_model_paths_code')


def parse_arguments() -> Namespace:
    parser: ArgumentParser = ArgumentParser()

    parser.add_argument('--notebook-output',
                        required=True,
                        help='Raw executed notebook.')

    parser.add_argument('--errors-to-skip-path',
                        required=True,
                        help='Path to the file in .json format with errors to skip.')

    return parser.parse_args()


def parse_notebook_output(notebook_output: str) -> List[str]:
    cell_outputs: List[str] = []

    notebooks_cells = json.loads(notebook_output)['cells']
    for cell in notebooks_cells:
        cell_id: str = cell['metadata']['cell_id']
        if cell['cell_type'] != 'code' or cell_id in CELL_IDS_WITH_NO_OUTPUT:
            continue
        cell_output = cell['outputs'][0]['text']
        cell_outputs.append(' '.join(cell_output))

    return cell_outputs


def validate_notebook_content(notebook_output: str, errors_to_skip: Dict[str, str]) -> int:
    cell_outputs = parse_notebook_output(notebook_output)

    for cell_output in cell_outputs:
        skip = 0
        for error_regexp in errors_to_skip.values():
            matches = re.search(error_regexp, cell_output, re.MULTILINE)
            if matches:
                skip = 1
                break
        if not skip and 'error' in cell_output.lower():
            print(cell_output)
            return 1

    return 0


if __name__ == '__main__':
    args = parse_arguments()

    with open(args.errors_to_skip_path, 'r', encoding='utf-8') as errors_file:
        errors_to_skip = json.load(errors_file)

    sys.exit(validate_notebook_content(args.notebook_output, errors_to_skip))
