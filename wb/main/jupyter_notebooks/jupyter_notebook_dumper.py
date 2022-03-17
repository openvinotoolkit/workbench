"""
 OpenVINO DL Workbench
 Class for Jupyter notebook creation

 Copyright (c) 2021 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
import json
from pathlib import Path
from typing import Optional, Dict, Any
import shutil

import nbformat
from jinja2 import Environment, FileSystemLoader
from notebook.services.contents.filemanager import FileContentsManager
from typing_extensions import Protocol

from config.constants import JUPYTER_CELL_TEMPLATES_FOLDER
from wb.main.enumerates import SupportedFrameworksEnum, ModelSourceEnum
from wb.main.jupyter_notebooks.cli_tools_options import CLIToolEnum
from wb.main.jupyter_notebooks.jupyter_notebook_cell import NotebookCellTypes, NotebookCellIds, NotebookCellConfig
from wb.main.jupyter_notebooks.notebook_template_creator import NotebookTemplateCreator
from wb.main.shared.enumerates import TaskEnum
from wb.main.utils.utils import remove_dir


class JupyterNotebookDumper:
    _assets_paths = [
        'resources/obtain_model_flow_diagram.png',
    ]

    _requirements = {
        'requirements.txt': 'resources/requirements.txt',
        'requirements_nlp.txt': 'resources/requirements_nlp.txt'
    }

    def __init__(self, notebook_path: str, notebook_template_creator: NotebookTemplateCreator):
        self._notebook_path = Path(notebook_path)
        self._notebook_template_cells = notebook_template_creator.create()
        if not self._notebook_directory_path.exists():
            self._notebook_directory_path.mkdir(parents=True)

    @property
    def _notebook_directory_path(self) -> Path:
        return self._notebook_path.parent

    def create_notebook(self, cells_context_map: dict):
        self._notebook_path.touch(exist_ok=True)
        self._initialize_notebook(cells_context_map=cells_context_map)
        self._copy_assets()
        self._copy_requirements(cells_context_map[NotebookCellIds.install_python_requirements_code])

    def _copy_assets(self):
        current_directory = Path(__file__).parent.absolute()
        for asset_path in self._assets_paths:
            shutil.copy(current_directory / asset_path, self._notebook_directory_path)

    def _copy_requirements(self, requirements_context: dict) -> None:
        current_directory = Path(__file__).parent.absolute()
        requirements_file = self._requirements[requirements_context['requirements_file']]
        shutil.copy(current_directory / requirements_file, self._notebook_directory_path)

    def delete_notebook(self):
        if self._notebook_directory_path.exists() and self._notebook_directory_path.is_dir():
            remove_dir(str(self._notebook_directory_path))

    class _CreateCellCallable(Protocol):
        def __call__(self, source: str, metadata: Optional[dict]) -> nbformat.NotebookNode:
            pass

    @staticmethod
    def _get_create_cell_function(cell_config: NotebookCellConfig) -> '_CreateCellCallable':
        return nbformat.v4.new_markdown_cell \
            if cell_config.cell_type == NotebookCellTypes.markdown else nbformat.v4.new_code_cell

    def _create_cell(self, cell_config: NotebookCellConfig, cell_template_context: dict) -> nbformat.NotebookNode:
        if cell_config.config_dumper_class:
            config_dumper = cell_config.config_dumper_class(notebook_directory_path=self._notebook_directory_path)
            config_dumper.dump(cell_template_context=cell_template_context)
        cell_content = self._get_rendered_cell_content(template_file_name=cell_config.template_filename,
                                                       context=cell_template_context)
        create_cell_function = self._get_create_cell_function(cell_config=cell_config)
        return create_cell_function(source=cell_content, metadata=cell_config.cell_metadata)

    def _initialize_notebook(self, cells_context_map: dict):
        fcm = FileContentsManager()
        notebook_metadata = {
            'kernelspec': {
                'display_name': 'Python 3',
                'language': 'python',
                'name': 'python3'
            },
        }
        notebook = nbformat.v4.new_notebook(metadata=notebook_metadata)
        notebook_cells = []
        for cell_config in self._notebook_template_cells:
            cell_context = cells_context_map.get(cell_config.cell_id, {})
            cell = self._create_cell(cell_config=cell_config, cell_template_context=cell_context)
            notebook_cells.append(cell)
        notebook['cells'] = notebook_cells
        fcm.check_and_sign(notebook, path=str(self._notebook_path))
        with self._notebook_path.open(mode='w') as file:
            nbformat.write(notebook, file, version=nbformat.NO_CONVERT)

    @staticmethod
    def _get_jinja_environment() -> Environment:
        env = Environment(loader=FileSystemLoader(JUPYTER_CELL_TEMPLATES_FOLDER),
                          trim_blocks=True, lstrip_blocks=True, autoescape=True)
        env.globals.update({
            'SupportedFrameworksEnum': SupportedFrameworksEnum,
            'ModelSourceEnum': ModelSourceEnum,
            'TaskEnum': TaskEnum,
            'CLIToolEnum': CLIToolEnum,
        })
        return env

    @staticmethod
    def _get_rendered_cell_content(template_file_name: str, context: dict) -> str:
        env = JupyterNotebookDumper._get_jinja_environment()
        template = env.get_template(template_file_name)
        return template.render(context)

    def _get_cell_config_by_id(self, cell_id: NotebookCellIds) -> NotebookCellConfig:
        return next(
            cell_config
            for cell_config in self._notebook_template_cells
            if cell_config.cell_id == cell_id
        )

    def _get_notebook_content(self) -> dict:
        raw_data = self._notebook_path.read_text()
        if not raw_data:
            raw_data = '{}'
        return json.loads(raw_data)

    @property
    def _notebook_cells(self) -> list:
        return self._get_notebook_content()['cells']

    @_notebook_cells.setter
    def _notebook_cells(self, cells: list):
        notebook_content = self._get_notebook_content()
        notebook_content['cells'] = cells
        self._write_to_notebook(notebook_content)

    def __contains__(self, item: NotebookCellIds) -> bool:
        return item in {cell.cell_id for cell in self._notebook_template_cells}

    @property
    def _generated_cells(self) -> list:
        return [cell for cell in self._notebook_cells if cell['metadata'].get('cell_id') is not None]

    def update_notebook_cells(self) -> None:
        """
        Add/delete notebook cells if there are more/fewer cells in _notebook_template_cells
        """
        if len(self._generated_cells) == len(self._notebook_template_cells):
            return

        cell_id_to_template = {template.cell_id.value: template for template in self._notebook_template_cells}
        if len(self._generated_cells) > len(self._notebook_template_cells):
            new_cells = [
                cell for cell in self._notebook_cells
                if (
                    cell["metadata"].get("cell_id") in cell_id_to_template
                    or cell["metadata"].get("cell_id") is None  # cell is created by user
                )
            ]
            self._notebook_cells = new_cells
            return

        missing_cells = self._missing_cells
        missing_cells_to_next_cell_id: Dict[str, list] = {}

        current_missing_cells = []
        for cell_id in cell_id_to_template:
            if cell_id not in missing_cells and current_missing_cells:
                missing_cells_to_next_cell_id[cell_id] = current_missing_cells
                current_missing_cells = []
            elif cell_id in missing_cells:
                current_missing_cells.append(missing_cells[cell_id])

        for cell_id, cells in missing_cells_to_next_cell_id.items():
            insert_pos = self._find_cell_index_by_id(cell_id=NotebookCellIds(cell_id))
            new_cells = self._notebook_cells
            new_cells[insert_pos:insert_pos] = cells
            self._notebook_cells = new_cells

        if current_missing_cells:
            new_cells = self._notebook_cells
            new_cells.extend(current_missing_cells)
            self._notebook_cells = new_cells

    @property
    def _missing_cells(self) -> Dict[str, Any]:
        existing_cells_metadata = tuple(cell['metadata'] for cell in self._generated_cells)
        return {
            cell_config.cell_id.value: self._create_cell(cell_config, {})
            for cell_config in self._notebook_template_cells
            if cell_config.cell_metadata not in existing_cells_metadata
        }

    @staticmethod
    def _find_cell_by_id(cells: dict, cell_id: NotebookCellIds) -> nbformat.NotebookNode:
        return next(cell for cell in cells if cell['metadata']['cell_id'] == cell_id.value)

    def _find_cell_index_by_id(self, cell_id: NotebookCellIds) -> int:
        return next(
            index
            for (index, cell) in enumerate(self._notebook_cells)
            if cell['metadata'] and cell['metadata']['cell_id'] == cell_id.value
        )

    def _write_to_notebook(self, content: dict):
        self._notebook_path.write_text(json.dumps(content))

    def update_cell(self, cell_id: NotebookCellIds, cell_template_context: dict):
        cell_config = self._get_cell_config_by_id(cell_id=cell_id)
        cell_index_to_update = self._find_cell_index_by_id(cell_id=cell_id)
        updated_cell = self._create_cell(cell_config=cell_config,
                                         cell_template_context=cell_template_context)
        notebook_cells = self._notebook_cells
        notebook_cells[cell_index_to_update] = updated_cell
        self._notebook_cells = notebook_cells
