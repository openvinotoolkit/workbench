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
import copy
import os
import platform
import re

FULL_NAME_PATTERNS_TO_SKIP = ['.*styles.*', '.*assets/css.*', '^3rdpartylicenses.txt$']

if platform.system() == 'Windows':
    FULL_NAME_PATTERNS_TO_SKIP = [i.replace('/', '\\\\') for i in FULL_NAME_PATTERNS_TO_SKIP]


def match(name: str, patterns: ()):
    return [re.match(pattern, name) for pattern in patterns]


def is_match(name: str, patterns: ()):
    return any(match(name, patterns))


def first_match(name: str, patterns: ()):
    for index, item in enumerate(match(name, patterns)):
        if item:
            return index


class TestBOMFile:
    @classmethod
    def setup(cls):
        cls.existing_files = []
        cls.cur_path = os.path.dirname(os.path.realpath(__file__))
        cls.static_path = os.environ['STATIC_PATH'] if 'STATIC_PATH' in os.environ else \
          os.path.join(os.path.dirname(os.path.realpath(__file__)), 'static')
        with open(os.path.join(cls.cur_path, 'automation', 'package_BOM.txt'), 'r') as bom_file:
            if platform.system() == 'Windows':
                cls.existing_files = [name.rstrip().replace('/', '\\') for name in bom_file.readlines()]
            else:
                cls.existing_files = [name.rstrip() for name in bom_file.readlines()]

    def test_bom_file_in_src(self):
        missing_files = list()
        copy_existing_files = [pattern for pattern in self.existing_files if 'assets' in pattern]
        dirs_to_search = ['assets']
        for src_dir in dirs_to_search:
            src_dir = os.path.join('src', src_dir)
            src_dir = os.path.join(self.cur_path, src_dir)
            if not os.path.isdir(src_dir):
                continue
            for root, _, files in os.walk(src_dir):
                for file_name in files:
                    full_name = os.path.join(root, file_name)
                    full_name = full_name[len(os.path.join(self.cur_path, 'src')) + 1:]
                    if is_match(full_name, FULL_NAME_PATTERNS_TO_SKIP):
                        continue
                    if full_name not in copy_existing_files:
                        missing_files.append(full_name)

        if missing_files:
            print('Missing files in BOM from src:')
            for file in missing_files:
                print(file.replace('\\', '/'))
        assert not missing_files

    def test_bom_file_integrity_static(self):
        missing_files = list()
        existing_files = copy.copy(self.existing_files)
        for root, _, files in os.walk(self.static_path):
            for file_name in files:
                full_name = os.path.join(root, file_name)
                full_name = os.path.relpath(full_name, self.static_path)
                if is_match(full_name, FULL_NAME_PATTERNS_TO_SKIP):
                    continue
                if not is_match(full_name, existing_files):
                    missing_files.append(full_name)
        if missing_files:
            print("Missing files:")
            for file in missing_files:
                print(file.replace('\\', '/'))
        assert not missing_files

    def test_bom_file_in_static(self):
        missing_files = list()
        copy_existing_files_patterns = copy.copy(self.existing_files)
        dirs_to_search = ['.']
        for src_dir in dirs_to_search:
            src_dir = os.path.join(self.static_path, src_dir)
            if not os.path.isdir(src_dir):
                continue
            for root, _, files in os.walk(src_dir):
                for file in files:
                    full_name = os.path.join(root, file)
                    if src_dir[-1] == '.':
                        suffix = '/./'
                    else:
                        suffix = '/'
                    full_name = full_name[len(self.static_path + suffix):]
                    if is_match(full_name, FULL_NAME_PATTERNS_TO_SKIP) or full_name in copy_existing_files_patterns:
                        continue
                    for pattern in copy_existing_files_patterns:
                        if pattern[0] == '^' and re.match(pattern, full_name):
                            break
                    else:
                        missing_files.append(full_name)
        if missing_files:
            print('Missing files in BOM from static:')
            for file in missing_files:
                print(file.replace('\\', '/'))
        assert not missing_files

    def test_alphabetical_order_and_duplicates(self):
        sorted_bom = sorted([x for x in self.existing_files if self.existing_files.count(x) == 1], key=str.lower)
        if self.existing_files != sorted_bom:
            print("Wrong order. Alphabetical order of BOM is:")
            print(*sorted_bom, sep='\n')
            assert self.existing_files == sorted_bom
