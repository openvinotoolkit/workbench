"""
 OpenVINO DL Workbench
 Abstract class for managing of bundles

 Copyright (c) 2020 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
import os
import shutil
from pathlib import Path
from typing import Tuple, Generator, Any, List

from config.constants import (JOBS_SCRIPTS_FOLDER, OPENVINO_ROOT_PATH, JOBS_SCRIPTS_FOLDER_NAME,
                              OPENVINO_DEV_WHEEL, RUNTIME_OPENVINO_WHEELS_PATHS, UBUNTU_18_BUNDLE_PATH,
                              UBUNTU_20_BUNDLE_PATH)
from wb.main.enumerates import TargetOSEnum
from wb.main.utils.bundle_creator.bundle_creator import BundleComponent, ComponentsParams, BundleCreator
from wb.main.utils.utils import create_empty_dir


class BundleComponentFromPackage(BundleComponent):
    def __init__(self, path_in_package: str, path_in_bundle: str = None, follow_symlinks: bool = True,
                 dependencies: Tuple['BundleComponent', ...] = ()):
        source_path = os.path.join(OPENVINO_ROOT_PATH, path_in_package)
        if path_in_bundle is None:
            path_in_bundle = path_in_package
            if os.path.isfile(source_path):
                path_in_bundle = os.path.dirname(path_in_package)
        super().__init__(source_path, path_in_bundle, follow_symlinks, dependencies=dependencies)


# pylint: disable=too-many-arguments
class SetupComponentsParams(ComponentsParams):

    def __init__(self, setup_script_path: str,
                 get_devices_script_path: str,
                 get_system_resources_script_path: str,
                 has_internet_connection_path: str,
                 operating_system: TargetOSEnum,
                 deploy_package_targets: list = (),
                 dependencies: list = (),
                 user_data_path: str = None):
        super().__init__()
        self.deploy_package_targets = deploy_package_targets
        self.operating_system = operating_system
        self.user_data_path = user_data_path
        self.components = {
            'setupScript': {
                'enabled': False,
                'component': SetupComponentsParams.create_setup_script_component(setup_script_path,
                                                                                 has_internet_connection_path)
            },
            'edgeNodeSetupScript': {
                'enabled': False,
                'component': SetupComponentsParams.get_edge_node_script_component()
            },
            'getDevicesScript': {
                'enabled': False,
                'component': SetupComponentsParams.get_devices_component(get_devices_script_path)
            },
            'getResourcesScript': {
                'enabled': False,
                'component': SetupComponentsParams.get_system_resources_component(get_system_resources_script_path)
            },
        }
        self.enable_dependencies(dependencies)

    def enable_dependencies(self, dependencies: list):
        for component_name in self.components:
            if dependencies and component_name not in dependencies:
                continue
            self.components[component_name]['enabled'] = True

    def get_components(self) -> Generator[BundleComponent, Any, None]:
        return (component['component'] for _, component in self.components.items() if component['enabled'])

    @staticmethod
    def create_setup_script_component(setup_script_path: str, has_internet_connection_path: str) -> BundleComponent:
        dependencies = [
            # Script to check internet connection
            BundleComponent(has_internet_connection_path,
                            JOBS_SCRIPTS_FOLDER_NAME, executable=True,
                            dependencies=(
                                BundleComponent(os.path.join(JOBS_SCRIPTS_FOLDER, 'has_internet_connection.py'),
                                                JOBS_SCRIPTS_FOLDER_NAME),
                            )),
            # Script to check if passwordless sudo enabled
            BundleComponent(os.path.join(JOBS_SCRIPTS_FOLDER, 'check_passwordless_sudo.sh'),
                            JOBS_SCRIPTS_FOLDER_NAME, executable=True),
            # Script to check an OS of the target
            BundleComponent(os.path.join(JOBS_SCRIPTS_FOLDER, 'is_supported_os.sh'),
                            JOBS_SCRIPTS_FOLDER_NAME, executable=True),
            # Script to check a Python version
            BundleComponent(os.path.join(JOBS_SCRIPTS_FOLDER, 'is_supported_python_version.sh'),
                            JOBS_SCRIPTS_FOLDER_NAME, executable=True),
            # Script to check a pip version
            BundleComponent(os.path.join(JOBS_SCRIPTS_FOLDER, 'is_supported_pip_version.sh'),
                            JOBS_SCRIPTS_FOLDER_NAME, executable=True),
            # Script to get full cpu name
            BundleComponent(os.path.join(JOBS_SCRIPTS_FOLDER, 'print_cpu_name.py'),
                            JOBS_SCRIPTS_FOLDER_NAME, executable=False),
        ]

        return BundleComponent(setup_script_path, JOBS_SCRIPTS_FOLDER_NAME,
                               executable=True,
                               dependencies=tuple(dependencies))

    @staticmethod
    def get_devices_component(get_devices_script_path: str) -> BundleComponent:
        get_devices_py = BundleComponent(os.path.join(JOBS_SCRIPTS_FOLDER, 'get_inference_engine_devices.py'),
                                         JOBS_SCRIPTS_FOLDER_NAME)
        return BundleComponent(get_devices_script_path, JOBS_SCRIPTS_FOLDER_NAME,
                               executable=True, dependencies=(get_devices_py,))

    @staticmethod
    def get_system_resources_component(get_system_resources_script_path: str, ) -> BundleComponent:
        get_resources_py = BundleComponent(os.path.join(JOBS_SCRIPTS_FOLDER, 'get_system_resources.py'),
                                           JOBS_SCRIPTS_FOLDER_NAME)
        return BundleComponent(get_system_resources_script_path, JOBS_SCRIPTS_FOLDER_NAME, executable=True,
                               dependencies=(get_resources_py,))

    @staticmethod
    def get_edge_node_script_component() -> BundleComponent:
        edge_node_script_component = BundleComponent(os.path.join(JOBS_SCRIPTS_FOLDER, 'edge_node_setup.py'),
                                                     JOBS_SCRIPTS_FOLDER_NAME, executable=False)
        openvino_dev_wheel_component = BundleComponent(OPENVINO_DEV_WHEEL, JOBS_SCRIPTS_FOLDER_NAME)
        openvino_runtime_wheels_components = [BundleComponent(runtime_wheel, JOBS_SCRIPTS_FOLDER_NAME)
                                              for runtime_wheel in RUNTIME_OPENVINO_WHEELS_PATHS]
        edge_node_script_component.dependencies = (
            openvino_dev_wheel_component, *openvino_runtime_wheels_components
        )
        return edge_node_script_component


class SetupBundleCreator(BundleCreator):
    def _store_bundle_content(self, components: SetupComponentsParams,
                              destination_bundle: str):
        self._create_deployment_bundle(deploy_package_targets=components.deploy_package_targets,
                                       operating_system=components.operating_system,
                                       result_bundle_path=destination_bundle)

        if components.user_data_path:
            tmp_user_data_path = os.path.join(destination_bundle, os.path.basename(components.user_data_path))
            shutil.copytree(components.user_data_path, tmp_user_data_path)

        # Copy dependency files
        self._copy_dependencies(components=components,
                                to_path=destination_bundle)

    @staticmethod
    def _path_to_source_bundles(operating_system: TargetOSEnum) -> Path:
        source_bundles_per_os = {
            TargetOSEnum.ubuntu18: UBUNTU_18_BUNDLE_PATH,
            TargetOSEnum.ubuntu20: UBUNTU_20_BUNDLE_PATH,
        }
        return Path(source_bundles_per_os[operating_system])

    def _create_deployment_bundle(self, deploy_package_targets: List[str],
                                  operating_system: TargetOSEnum,
                                  result_bundle_path: str):
        self._log(f'Start creating new setup bundle at the: {result_bundle_path}')
        path_to_source_bundles = self._path_to_source_bundles(operating_system)
        if not os.path.exists(result_bundle_path):
            create_empty_dir(result_bundle_path)
        progress_per_component = 20 / len(deploy_package_targets)
        for target in deploy_package_targets:
            bundle_path = path_to_source_bundles / f'{target.lower()}.tar.gz'
            if not os.path.exists(bundle_path):
                self._log(f'WARNING: Cannot find bundle for {operating_system} os and {target} target',
                          progress_increase=progress_per_component)
                continue
            self._log(f'Processing {target}', progress_increase=progress_per_component)
            shutil.unpack_archive(filename=bundle_path, extract_dir=result_bundle_path, format='gztar')

    def _copy_dependencies(self, components: SetupComponentsParams, to_path: str):
        progress_per_component = 40 / (components.count or 1)
        for dependency in components.get_components():
            self._log(f'Copying dependency {dependency.source_path}', progress_increase=progress_per_component)
            self._copy_component(dependency, root_bundle_path=to_path)
