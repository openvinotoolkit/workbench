"""
 OpenVINO DL Workbench
 Class for ORM model described a Model

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
import json
import os
from typing import Optional, List, Tuple

from sqlalchemy import Column, ForeignKey, Integer, Text, event, String
from sqlalchemy.orm import relationship, backref

from config.constants import UPLOAD_FOLDER_MODELS
from wb.main.enumerates import StatusEnum, AcceptableFileSizesMb, SupportedFrameworksEnum, ModelShapeTypeEnum, \
    LayoutDimValuesEnum
from wb.main.models.artifacts_model import ArtifactsModel
from wb.main.models.enumerates import MODEL_SOURCE_ENUM_SCHEMA, SUPPORTED_FRAMEWORKS_ENUM_SCHEMA, \
    MODEL_DOMAIN_ENUM_SCHEMA
from wb.main.models.environment_model import EnvironmentModel
from wb.main.models.jobs_model import JobData
from wb.main.models.omz_topology_model import OMZTopologyModel
from wb.main.models.topologies_metadata_model import TopologiesMetaDataModel
from wb.main.utils.utils import (find_by_ext, unify_precision_names, chmod_dir_recursively, get_framework_name,
                                 remove_dir)


class ModelJobData(JobData):
    modelId: int


class TopologiesModel(ArtifactsModel):
    __tablename__ = 'topologies'

    __mapper_args__ = {
        'polymorphic_identity': __tablename__
    }

    id = Column(Integer, ForeignKey(ArtifactsModel.id), primary_key=True)

    optimized_from = Column(Integer, ForeignKey(f'{__tablename__}.id'), nullable=True)
    converted_from = Column(Integer, ForeignKey(f'{__tablename__}.id'), nullable=True)
    downloaded_from = Column(Integer, ForeignKey(OMZTopologyModel.id), nullable=True)

    metadata_id = Column(Integer, ForeignKey(TopologiesMetaDataModel.id), nullable=False)
    precisions = Column(Text, nullable=True)
    framework = Column(SUPPORTED_FRAMEWORKS_ENUM_SCHEMA, nullable=True)
    domain = Column(MODEL_DOMAIN_ENUM_SCHEMA, nullable=True)
    source = Column(MODEL_SOURCE_ENUM_SCHEMA, nullable=True)

    manifest_path = Column(String, nullable=True)
    environment_id = Column(Integer, ForeignKey(EnvironmentModel.id), nullable=True)
    environment: EnvironmentModel = relationship(EnvironmentModel, lazy='joined')

    optimized_from_record = relationship('TopologiesModel', foreign_keys=[optimized_from], remote_side=[id],
                                         backref=backref('optimized_to', lazy='subquery', cascade='delete,all'))
    converted_from_record = relationship('TopologiesModel', foreign_keys=[converted_from], remote_side=[id],
                                         backref=backref('converted_to', lazy='subquery', cascade='delete,all'),
                                         cascade='delete,all')
    downloaded_from_record = relationship(OMZTopologyModel, foreign_keys=[downloaded_from], lazy='joined',
                                          backref=backref('downloaded_to', lazy='subquery', cascade='delete,all'))

    analysis_jobs = relationship('TopologyAnalysisJobsModel', back_populates='model',
                                 lazy='joined', cascade='delete,all')
    meta = relationship('TopologiesMetaDataModel', back_populates='topologies', lazy='joined')

    # Relationship backref typing
    wait_model_upload_job: 'WaitModelUploadJobsModel'
    optimized_to: Optional[List['TopologiesModel']]
    converted_to: Optional[List['TopologiesModel']]
    downloaded_to: Optional[List['OMZTopologyModel']]
    int8_job: Optional['JobsModel']
    mo_jobs_from_original: Optional[List['ModelOptimizerJobModel']]
    mo_jobs_from_result: Optional[List['ModelOptimizerJobModel']]
    model_downloader_job: Optional['OMZModelDownloadJobModel']
    mo_scan_job: Optional['ModelOptimizerScanJobsModel']
    apply_layout_jobs: Optional['ApplyModelLayoutJobModel']
    shapes: Optional['ModelShapeConfigurationModel']

    def __init__(self, name, framework, metadata_id):
        super().__init__(name)
        self.framework = framework
        self.metadata_id = metadata_id

    def get_precisions(self) -> Optional[List[str]]:
        return json.loads(self.precisions).get('body') if self.precisions else None

    def set_precisions(self, precisions: list):
        precisions_upper = [precision.upper() for precision in precisions]
        precisions_unified = unify_precision_names(precisions_upper)
        precisions_body = json.dumps({'body': precisions_unified})
        self.precisions = precisions_body

    @property
    def original_model(self) -> 'TopologiesModel':
        model = self
        while model.optimized_from:
            model = model.optimized_from_record
        return model

    def json(self):
        json_message = self.short_json()
        if self.mo_scan_job:
            mo_scan_data = self.mo_scan_job.json()
            json_message['mo'] = {
                'analyzedParams': mo_scan_data['information']
            }
        return json_message

    def short_json(self):
        return {
            **super().json(),
            'fileType': 'model',
            'readiness': self.status.value,
            'bodyPrecisions': self.get_precisions(),
            'modelSource': self.source.value if self.source else None,
            'framework': self.framework.value,
            'domain': self.domain.value if self.domain else None,
            'analysis': self.analysis_job.json() if self.analysis_job else {},
            'accuracyConfiguration': self.meta.json(),
            'visualizationConfiguration': self.meta.visualization_configuration_json(),
            'filesPaths': self.files_paths,
            'originalModelFramework': self.original_model_framework.value,
            'optimizedFromModelId': self.optimized_from,
            'shapes': [shape.json() for shape in self.shapes if shape.status == StatusEnum.ready],
            'isConfigured': self.is_configured,
            'selectedTokenizerId': self.selected_tokenizer_id
        }

    @property
    def is_configured(self) -> bool:
        if self.analysis_job:
            model_ir_version = int(self.analysis_job.ir_version) if self.analysis_job.ir_version else None
            if isinstance(model_ir_version, int) and model_ir_version <= 10:
                return True
        if not self.meta.layout_configuration:
            return False
        for input_config in self.meta.layout_configuration:
            if LayoutDimValuesEnum.N.value not in input_config['layout']:
                return False
        return self.is_shape_configured

    @property
    def is_shape_configured(self) -> bool:
        return any(
            shape
            for shape in self.shapes
            if shape.status == StatusEnum.ready and shape.shape_type == ModelShapeTypeEnum.static
        )

    @property
    def files_paths(self) -> Tuple[Optional[str], Optional[str]]:
        if not self.path:
            return None, None
        try:
            xml_file_path = find_by_ext(self.path, 'xml')
            bin_file_path = find_by_ext(self.path, 'bin')
            return xml_file_path, bin_file_path
        except StopIteration:
            return None, None

    @property
    def original_model_framework(self) -> SupportedFrameworksEnum:
        if self.converted_from:
            framework_name = get_framework_name(self.converted_from_record.framework)
            return SupportedFrameworksEnum(framework_name)
        if self.downloaded_from:
            return self.downloaded_from_record.framework
        if self.optimized_from:
            return self.optimized_from_record.original_model_framework
        return self.framework

    @property
    def analysis_job(self) -> Optional['TopologyAnalysisJobsModel']:
        ready_analysis_jobs = list(
            filter(lambda analysis_job: analysis_job.status == StatusEnum.ready, self.analysis_jobs))
        if not ready_analysis_jobs:
            return None
        return max(ready_analysis_jobs, key=lambda job: job.job_id)

    def get_xml_content(self) -> str:
        try:
            xml_path = find_by_ext(self.path, 'xml')
            with open(xml_path) as xml_file:
                return xml_file.read()
        except StopIteration:
            return ''

    @staticmethod
    def is_size_valid(size: float) -> bool:
        return size <= AcceptableFileSizesMb.MODEL.value

    @staticmethod
    def remove_model_files(model_id: int):
        remove_dir(os.path.join(UPLOAD_FOLDER_MODELS, str(model_id)))

    @property
    def original_framework(self) -> SupportedFrameworksEnum:
        if self.converted_from:
            return self.converted_from_record.framework
        if self.downloaded_from:
            return self.downloaded_from_record.framework
        if self.optimized_from:
            return self.optimized_from_record.original_model_framework
        return self.framework

    @property
    def tokenizers(self) -> List['TokenizerModel']:
        result = []
        for tokenizer_to_topology in self.tokenizers_to_topology:
            tokenizer = tokenizer_to_topology.tokenizer
            if tokenizer.status is StatusEnum.cancelled:
                continue
            tokenizer.selected = tokenizer_to_topology.selected
            result.append(tokenizer)

        return result

    @property
    def selected_tokenizer_id(self) -> Optional[int]:
        if self.optimized_from:
            return self.optimized_from_record.selected_tokenizer_id

        selected_tokenizer = next((tokenizer for tokenizer in self.tokenizers if tokenizer.selected), None)

        return selected_tokenizer.id if selected_tokenizer else None

    @property
    def tokenizer_model(self) -> Optional['TokenizerModel']:
        return next((tokenizer for tokenizer in self.tokenizers if tokenizer.selected), None)


@event.listens_for(TopologiesModel, 'after_update', propagate=True)
def set_permission_for_model(unused_mapper, unused_connection, model: TopologiesModel):
    if model.status != StatusEnum.ready or not model.path:
        return
    chmod_dir_recursively(os.path.dirname(model.path))
