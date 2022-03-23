"""
 OpenVINO DL Workbench
 Tests for checking migrations

 Copyright (c) 2021 Intel Corporation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
      http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
"""
from ast import parse, ImportFrom
from pathlib import Path
from typing import Set

from alembic.script import ScriptDirectory, Script
from flask_migrate import Migrate


class TestMigrations:
    _migration_scripts_directory = 'versions'

    @property
    def _local_migration_scripts_paths(self) -> Set[str]:
        migration_scripts_path: Path = Path(__file__).resolve().parent / self._migration_scripts_directory
        paths = migration_scripts_path.glob('*.py')
        result = set()
        for path in paths:
            result.add(str(path.absolute()))
        return result

    @property
    def _script_directory(self) -> ScriptDirectory:
        migrate = Migrate()
        config = migrate.get_config()
        return ScriptDirectory.from_config(config)

    def test_migrations_sequence(self):
        alembic_migration_scripts_paths = set()
        for script in self._script_directory.walk_revisions():
            script: Script
            alembic_migration_scripts_paths.add(script.path)
        assert alembic_migration_scripts_paths == self._local_migration_scripts_paths

    def test_no_wb_imports(self):
        for script in self._script_directory.walk_revisions():
            script: Script
            with open(script.path) as script_file:
                script_file_content = script_file.read()
                script_file_ast = parse(script_file_content)
                import_from_modules = [node.module for node in script_file_ast.body if isinstance(node, ImportFrom)]
                for import_from_module in import_from_modules:
                    assert not import_from_module.startswith('wb.'), \
                        f'Restricted import {import_from_module} is detected in file {script.path}'
