"""
 OpenVINO DL Workbench
 Class for base omz model download pipeline creator

 Copyright (c) 2021 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
import json
import os

from sqlalchemy.orm import Session

from config.constants import ORIGINAL_FOLDER, UPLOAD_FOLDER_MODELS
from wb.main.enumerates import PipelineTypeEnum, SupportedFrameworksEnum, ModelSourceEnum, ModelDomainEnum
from wb.main.models import OMZModelDownloadJobModel, OMZModelConvertJobModel, OMZModelMoveJobModel, \
    TopologiesMetaDataModel, TopologiesModel, OMZTopologyModel
from wb.main.models.omz_model_download_job_model import OMZModelDownloadJobData
from wb.main.models.omz_model_move_job_model import OMZModelMoveJobData
from wb.main.models.topologies_model import ModelJobData
from wb.main.pipeline_creators.model_creation.base_model_creation_pipeline_creator import \
    BaseModelCreationPipelineCreator


class BaseOMZModelPipelineCreator(BaseModelCreationPipelineCreator):
    pipeline_type = PipelineTypeEnum.download_omz_model
    _result_model: TopologiesModel

    def __init__(self, omz_topology: OMZTopologyModel, model_name: str, precision: str):
        super().__init__()
        self.omz_model = omz_topology
        self.model_name = model_name
        self.precision = precision

    def _create_result_model(self, session: Session):
        metadata = TopologiesMetaDataModel()
        metadata.write_record(session)
        self._result_model = TopologiesModel(self.model_name, SupportedFrameworksEnum.openvino, metadata.id)
        self._result_model.source = ModelSourceEnum.omz

        # consider all omz models CV so far
        self._result_model.domain = ModelDomainEnum.CV

        self._result_model.downloaded_from = self.omz_model.id
        self._result_model.write_record(session)
        self._result_model.path = os.path.join(UPLOAD_FOLDER_MODELS, str(self.result_model.id), ORIGINAL_FOLDER)
        self._result_model.write_record(session)

        self._result_model.meta.task_type = self.omz_model.task_type
        self._result_model.meta.topology_type = self.omz_model.topology_type
        self._result_model.meta.advanced_configuration = self.omz_model.advanced_configuration
        self._result_model.meta.visualization_configuration = json.dumps({
            'taskType': self.omz_model.task_type.value,
            'taskMethod': self.omz_model.topology_type.value,
            **json.loads(self.omz_model.advanced_configuration),
        })
        self._result_model.meta.inputs = self.omz_model.inputs
        self._result_model.write_record(session)

    def create_download_job(self, pipeline_id: int, previous_job_id: int = None) -> OMZModelDownloadJobModel:
        return OMZModelDownloadJobModel(OMZModelDownloadJobData(
            pipelineId=pipeline_id,
            modelId=self._result_model.id,
            modelName=self.model_name,
            path=self._result_model.path,
            precision=self.precision,
            projectId=None,
            previousJobId=previous_job_id
        ))

    def create_convert_job(self, pipeline_id: int, previous_job_id: int = None) -> OMZModelConvertJobModel:
        return OMZModelConvertJobModel(ModelJobData(
            modelId=self._result_model.id,
            pipelineId=pipeline_id,
            previousJobId=previous_job_id,
            projectId=None,
        ))

    def create_move_model_job(self, pipeline_id: int, previous_job_id: int = None) -> OMZModelMoveJobModel:
        return OMZModelMoveJobModel(OMZModelMoveJobData(
            modelId=self._result_model.id,
            omzModelId=self.omz_model.id,
            pipelineId=pipeline_id,
            previousJobId=previous_job_id,
            projectId=None,
        ))

    @property
    def result_model(self) -> TopologiesModel:
        return self._result_model
