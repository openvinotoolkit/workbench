"""
 OpenVINO DL Workbench
 Class for ORM model described an Artifacts Job

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
import hashlib
import logging
import os

from sqlalchemy import Column, Integer, Float, String, event
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import StatusEnum
from wb.main.models.base_model import BaseModel
from wb.main.models.enumerates import STATUS_ENUM_SCHEMA
from wb.main.utils.utils import remove_dir


# TODO: align on error handling approach
class TooLargePayloadException(Exception):
    pass


class ArtifactsModel(BaseModel):
    __tablename__ = 'artifacts'

    type = Column(String(30))

    __mapper_args__ = {
        'polymorphic_identity': 'artifact',
        'polymorphic_on': type
    }

    id = Column(Integer, primary_key=True, autoincrement=True)

    name = Column(String, nullable=False, default='artifact')
    path = Column(String, nullable=True)
    size = Column(Float, nullable=True, default=0.0)
    checksum = Column(String, nullable=True)

    progress = Column(Float, nullable=False, default=0)
    status = Column(STATUS_ENUM_SCHEMA, nullable=False, default=StatusEnum.queued)
    error_message = Column(String, nullable=True)

    task_id = Column(String, nullable=True)

    files = relationship('FilesModel', backref=backref('artifact', lazy='subquery'), cascade='delete,all')

    def __init__(self, name):
        self.name = name

    def json(self):
        return {
            'id': self.id,
            'name': self.name,
            'size': self.size,
            'path': self.path,
            'date': self.timestamp_to_milliseconds(self.creation_timestamp),
            'status': self.status_to_json(),
        }

    def status_to_json(self):
        status = {
            'name': self.status.value,
            'progress': self.progress
        }
        if self.error_message:
            status['errorMessage'] = self.error_message
        return status

    def artifact_exists(self) -> bool:
        if not self.path:
            return False
        return os.path.exists(self.path)

    def set_checksum(self):
        if not self.path:
            return
        self.checksum = ArtifactsModel.get_dir_hash(self.path)

    @staticmethod
    def get_dir_hash(directory):
        if not os.path.exists(directory):
            return -1
        hash_md5 = hashlib.md5()  # nosec: blacklist
        for root, _, files in os.walk(directory):
            for names in files:
                filepath = os.path.join(root, names)
                with open(filepath, 'rb') as current_file:
                    for chunk in iter(lambda cur_f=current_file: cur_f.read(4096), b''):
                        hash_md5.update(chunk)

        return hash_md5.hexdigest()

    @property
    def uploaded_progress(self):
        file_sizes = sum([f.size for f in self.files])
        file_weights = {f.name: f.size / file_sizes for f in self.files}
        return sum([f.progress * file_weights[f.name] for f in self.files])

    @property
    def is_all_files_uploaded(self) -> bool:
        if not self.files:
            return False
        return self.artifact_exists() and all(f.uploaded_blob_size == f.size for f in self.files)


@event.listens_for(ArtifactsModel, 'after_delete', propagate=True)
def handle_after_delete_artifact(unused_mapper, unused_connection, artifact: ArtifactsModel):
    logging.warning(f'[DEBUG LOG] Running artifact {artifact.id} after_delet hook')
    if not artifact.path or not os.path.exists(artifact.path):
        return
    if os.path.isfile(artifact.path):
        logging.warning(f'[DEBUG LOG] Removing artifact {artifact.id} as file')
        os.remove(artifact.path)
    if os.path.isdir(artifact.path):
        logging.warning(f'[DEBUG LOG] Removing artifact {artifact.id} as directory')
        remove_dir(artifact.path)
