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

import os
from typing import Dict

try:
    from typing import TypedDict
except ImportError:
    from typing_extensions import TypedDict

from sqlalchemy import Column, Integer, Float, String, Enum, ForeignKey
from werkzeug.utils import secure_filename

from wb.extensions_factories.database import get_db_session_for_app
from wb.main.enumerates import StatusEnum
from wb.main.models.base_model import BaseModel


class FileMetaData(TypedDict):
    name: str
    size: float


class FilesModel(BaseModel):
    __tablename__ = 'files'

    id = Column(Integer, primary_key=True, autoincrement=True)

    artifact_id = Column(Integer, ForeignKey('artifacts.id'), nullable=False)

    name = Column(String, nullable=False)
    path = Column(String, nullable=True)

    size = Column(Float, nullable=True)
    uploaded_blob_size = Column(Float, nullable=True, default=0)
    progress = Column(Float, nullable=False, default=0)
    status = Column(Enum(StatusEnum), nullable=False, default=StatusEnum.queued)
    error_message = Column(String, nullable=True)

    # Relationship typings
    artifact: 'ArtifactsModel'

    def __init__(self, name: str, artifact_id: int, size: float):
        self.name = name
        self.artifact_id = artifact_id
        self.size = size

    def json(self):
        return {
            'id': self.id,
            'name': self.name,
            'size': self.size,
            'date': self.creation_timestamp.timestamp(),
            'status': self.status_to_json()
        }

    def status_to_json(self):
        status = {
            'name': self.status.value,
            'progress': self.progress
        }
        if self.error_message:
            status['errorMessage'] = self.error_message
        return status

    @staticmethod
    def create_file_record(file_data: FileMetaData, artifact_id: int, path: str) -> int:
        file_record = FilesModel(file_data['name'], artifact_id, file_data['size'])
        file_record.write_record(get_db_session_for_app())
        file_record.path = path
        file_record.write_record(get_db_session_for_app())
        return file_record.id

    @classmethod
    def create_files(cls, files: Dict[str, FileMetaData], artifact_id: int, artifact_path: str) -> Dict[str, int]:
        result = {}
        for file_idx, file_data in files.items():
            result[file_idx] = cls.create_file(file_data, artifact_id, artifact_path)
        return result

    @classmethod
    def create_file(cls, file: FileMetaData, artifact_id: int, artifact_path: str) -> int:
        file['name'] = secure_filename(file['name'])
        file_path = os.path.join(artifact_path, file['name'])
        return cls.create_file_record(file, artifact_id, file_path)
