"""
 OpenVINO DL Workbench
 Class for creation job for downloading tuned model

 Copyright (c) 2018 Intel Corporation

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
import re
import tarfile
from contextlib import closing

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.interfaces.job_observers import DownloadModelDBObserver
from wb.main.enumerates import JobTypesEnum
from wb.main.models.download_configs_model import ModelDownloadConfigsModel
from wb.main.enumerates import StatusEnum

from wb.main.models.topologies_model import TopologiesModel


class DownloadModelJob(IJob):
    job_type = JobTypesEnum.download_model_type
    _job_model_class = ModelDownloadConfigsModel
    ext = '.tar.gz'

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        download_model_db_observer = DownloadModelDBObserver(job_id=self._job_id)
        self._job_state_subject.attach(download_model_db_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, progress=0)
        session = get_db_session_for_celery()
        with closing(session):
            config: ModelDownloadConfigsModel = session.query(ModelDownloadConfigsModel).get(self._job_id)
            artifact = config.downloadable_artifact
            source_dir = self.find_source_dir(config.model_id)
            archive_exists, archive_path = artifact.archive_exists()
            if not archive_exists:
                archive_path = artifact.build_full_artifact_path()
                self.pack_model(archive_path, source_dir, re.sub(self.ext, '', config.name))
            artifact.update(archive_path)
            artifact.write_record(session)
        self._job_state_subject.update_state(status=StatusEnum.ready, progress=100)
        self._job_state_subject.detach_all_observers()

    def on_failure(self, exception: Exception):
        session = get_db_session_for_celery()
        with closing(session):
            config: ModelDownloadConfigsModel = session.query(ModelDownloadConfigsModel).get(self._job_id)
            file_path = config.downloadable_artifact.build_full_artifact_path()
        if file_path:
            os.remove(file_path)
        super().on_failure(exception)

    @staticmethod
    def find_source_dir(topology_id: int) -> str:
        session = get_db_session_for_celery()
        with closing(session):
            topology = session.query(TopologiesModel).get(topology_id)
            path = topology.path
        return path

    @staticmethod
    def pack_model(output_filename: str, source_dir: str, model_name: str):
        with tarfile.open(output_filename, 'w:gz') as tar:
            for model_item in os.listdir(source_dir):
                _, file_extension = os.path.splitext(model_item)
                if file_extension in ['.bin', '.xml']:
                    tar.add(os.path.join(source_dir, model_item), arcname=(model_name + file_extension))
