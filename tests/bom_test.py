"""
 Copyright (c) 2019 Intel Corporation

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

import os
import platform
import re
from pathlib import Path

DIR_PATTERS_TO_SKIP = (
    r'.*__pycache__.*',
    r'^wb/data.*',
    r'^docker\/bootstrap\/.*',
    r'^docker\/dockerfiles\/.*',
    r'^docker\/dockerfile_generator\/.*',
    r'^docker\/remote_execution_docker\/.*',
    r'^scripts\/linux\/.*',
    r'^scripts\/mac\/.*',
    r'^scripts\/windows\/.*',
    r'.*tests.*',
    r'.*wheels.*',
    r'.*node_modules.*',
    r'.*\.git.*',
    r'.*client.*',
    r'.*static.*',
    r'.*idea.*',
    r'.*automation.*',
    r'.*\.ipynb_checkpoints',
    r'.*e2e_tests.*',
    r'.*unit_tests.*',
    r'^model_analyzer.*',
    r'^starting_package.*',
    r'^postman\/.*',
    r'.*docs.*',
    r'.*venv.*',
    r'^vars.*',
    r'^\.env',
    r'^dist.*',
    r'^build.*',
    r'^.pytest_cache/*',
    r'^scripts\/development\/.*',
    r'^docker\/dc_dev_config\/.*',
    r'.*\.pytest_cache',
    r'^bundles\/.*',
    r'.*openvino_notebooks.*',
    r'^ci.*',
)

FILE_PATTERNS_TO_SKIP = (
    r'.*install_internal_ssl_chain.sh.*',
    r'.*_test\.py$',
    r'.*\.pyc$',
    r'.*\.dockerignore$',
    r'.*\.pylintrc$',
    r'.*CONTRIBUTING\.md$',
    r'.*pull_request_template\.md$',
    r'LICENSE$',
    r'third-party-programs\.txt$',
    r'.*\.log',
    r'.*requirements_dev\.txt.*',
    r'.*requirements_snyk\.txt.*',
    r'.*requirements_bootstrap\.txt.*',
    r'.*package-lock\.json$',
    r'.*\.DS_Store$',
    r'Dockerfile',
    r'.*\.env',
    r'^\.pre-commit-config\.yaml$',
    r'^wb\/utils\/git_hooks_checker\.py$',
    r'^scripts\/development\/erase_db\.sql$',
    r'^scripts\/development\/check_git_remote_pre_push\.py$',
    r'^docker\/docker-compose(\.local)?(\.test\.bootstrap)?\.yml$',
    r'^docker\/dockerfiles\/Dockerfile_opensource_image\.template$',
    r'^docker\/local\/build_image\.sh$',
)

FULL_NAME_PATTERNS_TO_SKIP = (
    r'^wb/data/.*',
    r'^nginx/mac\..*',
    r'^development/.*'
)

if platform.system() == 'Windows':
    FULL_NAME_PATTERNS_TO_SKIP = [i.replace('/', '\\\\') for i in FULL_NAME_PATTERNS_TO_SKIP]
    DIR_PATTERS_TO_SKIP = [i.replace('/', '\\\\') for i in DIR_PATTERS_TO_SKIP]


def is_match(name: str, patterns: tuple) -> bool:
    return any((re.match(pattern, name) for pattern in patterns))


class TestBOMFile:
    parent_path = Path(__file__).parent.parent
    bom_file_path = parent_path / 'automation' / 'bom' / 'image_BOM.txt'

    _migration_header_pattern = r'''(\"){3}[\w\d -]+

Revision ID: \w{12}
Revises: \w{0,12}
Create Date: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{6}

(\"){3}'''

    _intel_header_pattern = r'''(\"){3}
 OpenVINO DL Workbench
 .*

 Copyright \(c\) [0-9\-]+ Intel Corporation

 Licensed under the Apache License, Version 2.0 \(the \"License\"\);
 you may not use this file except in compliance with the License\.
 You may obtain a copy of the License at
 {6}http:\/\/www\.apache\.org/licenses/LICENSE-2\.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an \"AS IS\" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied\.
 See the License for the specific language governing permissions and
 limitations under the License\.
(\"){3}'''

    _content_pattern = r'[\s\S]*'

    @classmethod
    def source_file_pattern(cls):
        return re.compile(
f'''({cls._migration_header_pattern}

)?{cls._intel_header_pattern}
{cls._content_pattern}''')

    # pylint: disable=attribute-defined-outside-init
    def setup_method(self, unused_method):
        with open(self.bom_file_path, 'r', encoding='utf-8') as bom_file:
            self.existing_files = [name.rstrip() for name in bom_file.readlines()]
        if platform.system() == 'Windows':
            self.existing_files = [name.replace('/', '\\') for name in self.existing_files]

    def test_bom_file_integrity(self):
        missing_files = list()
        for root, _, files in os.walk(self.parent_path):
            if is_match(root, DIR_PATTERS_TO_SKIP):
                continue
            for file in files:
                full_name = (Path(root) / file).absolute()
                relative_name = str(full_name.relative_to(self.parent_path))
                skip_relative_paths = (*FILE_PATTERNS_TO_SKIP, *FULL_NAME_PATTERNS_TO_SKIP, *DIR_PATTERS_TO_SKIP)
                if is_match(relative_name, skip_relative_paths):
                    continue
                if relative_name not in self.existing_files:
                    missing_files.append(relative_name)
        if missing_files:
            print('Missing files:')
            for file in missing_files:
                print(file.replace('\\', '/'))
        assert not missing_files

    def test_deleted_files_still_stored_in_bom(self):
        deleted = list()
        ignores = (
            r'^static',
        )
        for file in self.existing_files:
            if is_match(file, ignores):
                continue
            if not os.path.isfile(os.path.join(self.parent_path, file)):
                deleted.append(file)
        if deleted:
            print('Deleted files still stored in BOM file:')
            for file in deleted:
                print(file)
        if deleted:
            print(f'{len(deleted)} files deleted but still stored in BOM')
        assert not deleted

    def test_alphabetical_order_and_duplicates(self):
        sorted_bom = sorted(self.existing_files, key=str.lower)
        if self.existing_files != sorted_bom:
            print('Wrong order. Alphabetical order of BOM is:')
            print(*sorted_bom, sep='\n')
            assert self.existing_files == sorted_bom

    def test_missed_intel_header(self):
        file_content_pattern = self.source_file_pattern()
        ignores = (
            r'^__init__.py$',
            r'.*_test.py$',
        )
        missing_files = list()
        for root, _, files in os.walk(self.parent_path):
            if is_match(root, DIR_PATTERS_TO_SKIP):
                continue
            for file in files:
                full_name = (Path(root) / Path(file)).absolute()
                relative_name = str(full_name.relative_to(self.parent_path))
                if not is_match(file, ('.*.py$',)) or is_match(file, ignores) or \
                        is_match(relative_name, (*DIR_PATTERS_TO_SKIP, *FULL_NAME_PATTERNS_TO_SKIP)):
                    continue
                with open(full_name, 'r', encoding='utf-8') as source_f:
                    file_content = source_f.read()
                    if not file_content_pattern.fullmatch(file_content):
                        missing_files.append(str(full_name))
        if missing_files:
            files_list = '\n'.join(missing_files)
            print(f'{len(missing_files)} files with missed header: {files_list}')
        assert not missing_files
