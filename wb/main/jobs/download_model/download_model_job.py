"""
 OpenVINO DL Workbench
 Class for creation job for downloading tuned model

 Copyright (c) 2018 Intel Corporation

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
import re
import tarfile
from contextlib import closing

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.interfaces.job_observers import DownloadModelDBObserver
from wb.main.enumerates import JobTypesEnum
from wb.main.models.download_configs_model import ModelDownloadConfigsModel
from wb.main.models.downloadable_artifacts_model import DownloadableArtifactsModel
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
                archive_path = DownloadableArtifactsModel.get_archive_path(artifact.id)
                self.pack_model(archive_path, source_dir, re.sub(self.ext, '', config.name))
            artifact.update(archive_path)
            artifact.write_record(session)
        self._job_state_subject.update_state(status=StatusEnum.ready, progress=100)
        self._job_state_subject.detach_all_observers()

    def on_failure(self, exception: Exception):
        session = get_db_session_for_celery()
        with closing(session):
            config: ModelDownloadConfigsModel = session.query(ModelDownloadConfigsModel).get(self._job_id)
            file_path = DownloadableArtifactsModel.get_archive_path(config.downloadable_artifact.id)
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
