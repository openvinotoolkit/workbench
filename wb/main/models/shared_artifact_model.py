"""
 OpenVINO DL Workbench
 Class for ORM model for artifacts that can be shared

 Copyright (c) 2022 Intel Corporation

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
from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import ArtifactTypesEnum
from wb.main.utils.utils import get_size_of_files
from wb.main.models.artifacts_model import ArtifactsModel
from wb.main.models.enumerates import ARTIFACT_TYPES_ENUM_SCHEMA
from wb.main.models.jobs_model import JobsModel


class SharedArtifactModel(ArtifactsModel):
    __tablename__ = 'shared_artifacts'

    __mapper_args__ = {
        'polymorphic_identity': __tablename__
    }

    id = Column(Integer, ForeignKey(ArtifactsModel.id), primary_key=True)
    artifact_type = Column(ARTIFACT_TYPES_ENUM_SCHEMA, nullable=False)
    job_id = Column(Integer, ForeignKey('jobs.job_id'), nullable=True)

    job = relationship(JobsModel, backref=backref('shared_artifact',
                                                  cascade='all,delete-orphan', uselist=False))

    deployment_bundle_config: 'DeploymentBundleConfigModel'

    def __init__(self, artifact_type: ArtifactTypesEnum, job_id: int = None, name: str = None):
        artifact_name = name or f'{artifact_type.value}_{job_id}'
        super().__init__(artifact_name)
        self.artifact_type = artifact_type
        self.job_id = job_id

    def update(self, path: str):
        self.path = path
        self.size = get_size_of_files(path)

    def build_full_artifact_path(self, ext: str = '.tar.gz') -> str:
        raise NotImplementedError()

    @property
    def is_archive(self) -> bool:
        raise NotImplementedError()
