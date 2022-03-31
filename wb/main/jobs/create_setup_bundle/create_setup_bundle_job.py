"""
 OpenVINO DL Workbench
 Class for create setup bundle job

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
import os
import shutil
import tempfile
from contextlib import closing

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.utils.database_functions import set_status_in_db
from wb.main.models import CreateSetupBundleJobModel, SharedArtifactModel
from wb.main.scripts.job_scripts_generators.setup_script_generator import (SetupScriptGenerator,
                                                                           get_setup_script_generator)
from wb.main.utils.bundle_creator.setup_bundle_creator import SetupBundleCreator, SetupComponentsParams
from wb.main.utils.utils import find_by_ext


class CreateSetupBundleJob(IJob):
    job_type = JobTypesEnum.create_setup_bundle_type
    _job_model_class = CreateSetupBundleJobModel

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._attach_default_db_and_socket_observers()
        with closing(get_db_session_for_celery()) as session:
            create_bundle_job_model: CreateSetupBundleJobModel = self.get_job_model(session)
            deployment_bundle_config = create_bundle_job_model.deployment_bundle_config
            self.deployment_bundle_id = deployment_bundle_config.deployment_bundle_id
            self.additional_components = [name for name, value in deployment_bundle_config.json().items() if value]
            self.targets = deployment_bundle_config.targets_to_json
            self.operating_system = deployment_bundle_config.operating_system
            self.include_model = deployment_bundle_config.include_model
            self.topology_name = create_bundle_job_model.project.topology.name if self.include_model else None
            self.topology_path = create_bundle_job_model.project.topology.path if self.include_model else None
            bundle: SharedArtifactModel = create_bundle_job_model.deployment_bundle_config.deployment_bundle
            self.bundle_path = bundle.build_full_artifact_path()
            self.is_archive = bundle.is_archive
            self.pipeline_type = create_bundle_job_model.pipeline.type

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, log='Preparing setup bundle.')

        with tempfile.TemporaryDirectory('rw') as tmp_scripts_folder:
            setup_path = self.generate_script_from_template(tmp_scripts_folder, 'setup.sh')
            get_devices_path = self.generate_script_from_template(tmp_scripts_folder,
                                                                  'get_inference_engine_devices.sh')
            get_resources_path = self.generate_script_from_template(tmp_scripts_folder, 'get_system_resources.sh')
            has_internet_connection_path = self.generate_script_from_template(tmp_scripts_folder,
                                                                              'has_internet_connection.sh')
            topology_temporary_path = None

            if self.include_model:
                topology_temporary_path = os.path.join(tmp_scripts_folder, self.topology_name)
                os.makedirs(topology_temporary_path)
                xml_file = find_by_ext(self.topology_path, 'xml')
                tmp_xml_file = os.path.join(topology_temporary_path, f'{self.topology_name}.xml')
                shutil.copy(xml_file, tmp_xml_file)

                bin_file = find_by_ext(self.topology_path, 'bin')
                tmp_bin_file = os.path.join(topology_temporary_path, f'{self.topology_name}.bin')
                shutil.copy(bin_file, tmp_bin_file)

            setup_bundle_creator = SetupBundleCreator(
                log_callback=lambda message, progress:
                self._job_state_subject.update_state(log=message,
                                                     progress=progress)
            )
            setup_components = SetupComponentsParams(setup_path, get_devices_path,
                                                     get_resources_path,
                                                     has_internet_connection_path,
                                                     self.operating_system,
                                                     self.targets,
                                                     self.additional_components,
                                                     topology_temporary_path)
            setup_bundle_creator.create(components=setup_components,
                                        destination_bundle=self.bundle_path,
                                        is_archive=self.is_archive)
        self.on_success()

    def generate_setup_script_from_template(self, result_scripts_path: str, script_name: str) -> str:
        result_script_path = os.path.join(result_scripts_path, script_name)
        job_script_generator = get_setup_script_generator(self.pipeline_type, script_name)
        job_script_generator.create(result_file_path=result_script_path)
        return result_script_path

    @staticmethod
    def generate_script_from_template(result_scripts_path: str, script_name: str) -> str:
        result_script_path = os.path.join(result_scripts_path, script_name)
        job_script_generator = SetupScriptGenerator(script_name)
        job_script_generator.create(result_file_path=result_script_path)
        return result_script_path

    def on_success(self):
        with closing(get_db_session_for_celery()) as session:
            deployment_job = self.get_job_model(session)
            bundle = deployment_job.deployment_bundle_config.deployment_bundle
            bundle.update(self.bundle_path)
            bundle.write_record(session)
            self._job_state_subject.update_state(status=StatusEnum.ready,
                                                 log='Setup bundle created successfully.')
            set_status_in_db(SharedArtifactModel, bundle.id, StatusEnum.ready, session, force=True)
            self._job_state_subject.detach_all_observers()
