"""
 OpenVINO DL Workbench
 Class for managing of bundle for remote execution

 Copyright (c) 2020 Intel Corporation

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
import logging as log
import os
import shutil
import stat
import tempfile
from typing import Callable, Tuple, Generator, Any, Dict, Union


class BundleComponent:
    def __init__(self, source_path: str, bundle_path: str, follow_symlinks: bool = True, executable: bool = False,
                 dependencies: Tuple['BundleComponent', ...] = ()):
        self.source_path = source_path
        self.bundle_path = bundle_path
        self.follow_symlinks = follow_symlinks
        self.executable = executable
        self.dependencies = dependencies


class ComponentsParams:
    def __init__(self):
        self.components: Dict[str, Dict[str, Union[bool, BundleComponent]]] = {}

    def enable_dependencies(self, dependencies: list):
        for component_name in self.components:
            if dependencies and component_name not in dependencies:
                continue
            self.components[component_name]['enabled'] = True

    def get_components(self) -> Generator[BundleComponent, Any, None]:
        return (component['component'] for _, component in self.components.items() if component['enabled'])

    @property
    def count(self) -> int:
        return len(list(self.get_components()))


class BundleCreator:
    def __init__(self, log_callback: Callable[[str, float], None]):
        self._progress = 0
        self._log_callback = log_callback

    def create(self, components: ComponentsParams,
               destination_bundle: str, is_archive: bool = True) -> str:
        if is_archive:
            with tempfile.TemporaryDirectory() as tmpdirname:
                self._store_bundle_content(components, tmpdirname)
                return self._make_bundle_archive(tmpdirname, destination_bundle)
        if os.path.exists(destination_bundle):
            shutil.rmtree(destination_bundle)
        os.makedirs(destination_bundle, exist_ok=True)
        return self._store_bundle_content(components, destination_bundle)

    def _store_bundle_content(self, components: ComponentsParams,
                              destination_bundle: str):
        raise NotImplementedError

    def _log(self, message: str, progress_increase: float = 0):
        self._progress = min(self._progress + progress_increase, 99)
        log.debug(message)
        log.debug('full progress - %d', self._progress)
        self._log_callback(message, self._progress)

    def _make_bundle_archive(self, bundle_content_path: str, destination_bundle: str) -> str:
        destination_bundle_path = os.path.dirname(destination_bundle)
        if not os.path.exists(destination_bundle_path):
            os.makedirs(destination_bundle_path)

        bundle_basename_path = os.path.splitext(destination_bundle)[0]
        if '.tar' in bundle_basename_path:
            bundle_basename_path = os.path.splitext(bundle_basename_path)[0]

        self._log('Making bundle archive...', progress_increase=20)
        bundle_archive_path = shutil.make_archive(
            base_name=bundle_basename_path,
            root_dir=bundle_content_path,
            format='gztar')
        self._log(f'Bundle archive created in {destination_bundle}', progress_increase=30)

        return bundle_archive_path

    @staticmethod
    def _copy_to_dir(source_path: str, dst_path: str, follow_symlinks: bool = True, executable: bool = False):
        if not os.path.exists(source_path):
            raise FileNotFoundError(f'Source path not found in {source_path}')
        if os.path.isfile(source_path):
            filename = os.path.basename(source_path)
            if not os.path.exists(dst_path):
                os.makedirs(dst_path)
            dst_path = os.path.join(dst_path, filename)
            shutil.copy(source_path, dst_path)
            if executable:
                BundleCreator._make_executable(dst_path)
        else:
            if os.path.exists(dst_path):
                shutil.rmtree(dst_path)
            shutil.copytree(source_path, dst_path, symlinks=not follow_symlinks)

    @staticmethod
    def _copy_component(component: BundleComponent, root_bundle_path: str):
        source = component.source_path
        for dep_component in component.dependencies:
            BundleCreator._copy_component(dep_component, root_bundle_path)
        destination = os.path.join(root_bundle_path, component.bundle_path)
        BundleCreator._copy_to_dir(source, destination, component.follow_symlinks,
                                   component.executable)

    @staticmethod
    def _make_executable(script_path: str):
        script_st = os.stat(script_path)
        os.chmod(script_path, script_st.st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)

