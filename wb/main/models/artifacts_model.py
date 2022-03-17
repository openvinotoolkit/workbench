"""
 OpenVINO DL Workbench
 Class for ORM model described an Artifacts Job

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
import hashlib
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
    if not artifact.path or not os.path.exists(artifact.path):
        return
    if os.path.isfile(artifact.path):
        os.remove(artifact.path)
    if os.path.isdir(artifact.path):
        remove_dir(artifact.path)
