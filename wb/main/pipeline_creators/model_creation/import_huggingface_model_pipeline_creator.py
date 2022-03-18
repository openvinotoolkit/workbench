"""
 OpenVINO DL Workbench
 ImportHuggingfaceModelPipelineCreator

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
import os

from sqlalchemy.orm import Session

from config.constants import UPLOAD_FOLDER_MODELS, ORIGINAL_FOLDER
from wb.main.enumerates import PipelineTypeEnum, PipelineStageEnum, SupportedFrameworksEnum, ModelSourceEnum
from wb.main.environment.manifest import ManifestFactory, ManifestDumper, Manifest
from wb.main.environment.manifest.requirements import RequirementsCollector
from wb.main.models import (PipelineModel, TopologyAnalysisJobsModel, ModelOptimizerScanJobModel,
                            ModelOptimizerJobModel, TopologiesModel, SetupEnvironmentJobModel,
                            AnalyzeModelInputShapeJobModel, TopologiesMetaDataModel)
from wb.main.models.huggingface.import_huggingface_model_job_model import ImportHuggingfaceJobModel, \
    ImportHuggingfaceJobData
from wb.main.models.model_optimizer_job_model import ModelOptimizerJobData
from wb.main.models.topologies_model import ModelJobData
from wb.main.pipeline_creators.model_creation.base_model_creation_pipeline_creator import \
    BaseModelCreationPipelineCreator
from wb.main.utils.utils import create_empty_dir


class ImportHuggingfaceModelPipelineCreator(BaseModelCreationPipelineCreator):
    pipeline_type = PipelineTypeEnum.upload_model

    _result_model: TopologiesModel
    _model_optimizer_job_id: int

    _job_type_to_stage_map = {
        SetupEnvironmentJobModel.get_polymorphic_job_type(): PipelineStageEnum.setup_environment,
        ImportHuggingfaceJobModel.get_polymorphic_job_type(): PipelineStageEnum.import_huggingface_model,

        ModelOptimizerScanJobModel.get_polymorphic_job_type(): PipelineStageEnum.model_optimizer_scan,
        ModelOptimizerJobModel.get_polymorphic_job_type(): PipelineStageEnum.convert_model,
        AnalyzeModelInputShapeJobModel.get_polymorphic_job_type(): PipelineStageEnum.model_analyzer,
        TopologyAnalysisJobsModel.get_polymorphic_job_type(): PipelineStageEnum.model_analyzer,
    }

    def __init__(self, model_id: int, huggingface_model_id: str, model_name: str):
        super().__init__()
        self.model_id = model_id
        self.huggingface_model_id = huggingface_model_id
        self.model_name = model_name

    def create_result_model(self, session: Session):
        uploaded_model: TopologiesModel = session.query(TopologiesModel).get(self.model_id)

        metadata = TopologiesMetaDataModel()
        metadata.write_record(session)

        self._result_model = TopologiesModel(self.model_name, SupportedFrameworksEnum.openvino, metadata.id)
        self._result_model.domain = uploaded_model.domain
        self._result_model.source = uploaded_model.source
        self._result_model.converted_from = self.model_id
        self._result_model.write_record(session)
        self._result_model.path = os.path.join(UPLOAD_FOLDER_MODELS, str(self.result_model.id), ORIGINAL_FOLDER)
        self._result_model.write_record(session)

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        self.create_result_model(session)
        create_environment_job = self.create_environment_setup_job(
            model_id=self.model_id,
            previous_job_id=None,
            session=session
        )

        uploaded_model: TopologiesModel = session.query(TopologiesModel).get(self.model_id)

        manifest = ManifestFactory.create_topology_specific(uploaded_model)
        huggingface_onnx_requirements = RequirementsCollector.get_extra_requirements()['huggingface_onnx']
        manifest = Manifest(
            requirements=[*manifest.packages, *huggingface_onnx_requirements],
            model_name=manifest.model_name,
            manifest_path=manifest.path
        )

        create_empty_dir(uploaded_model.path)
        ManifestDumper.dump_to_yaml(manifest)

        uploaded_model.manifest_path = str(manifest.path)
        uploaded_model.write_record(session)

        self.result_model.manifest_path = str(manifest.path)
        self.result_model.write_record(session)

        import_hf_model_job = ImportHuggingfaceJobModel(ImportHuggingfaceJobData(
            modelId=self.model_id,
            huggingface_model_id=self.huggingface_model_id,
            pipelineId=pipeline.id,
            previousJobId=create_environment_job.job_id,
            projectId=None,
        ))
        self._save_job_with_stage(import_hf_model_job, session)

        model_optimizer_scan_job = self.create_model_optimizer_scan_job(pipeline_id=pipeline.id,
                                                                        previous_job_id=import_hf_model_job.job_id)
        self._save_job_with_stage(model_optimizer_scan_job, session)
        model_optimizer_job = self.create_model_optimizer_job(pipeline_id=pipeline.id,
                                                              previous_job_id=model_optimizer_scan_job.job_id)
        self._save_job_with_stage(model_optimizer_job, session)
        input_shape_analysis_job = self.create_model_input_shape_analysis_job(
            pipeline_id=pipeline.id,
            model_id=self._result_model.id,
            previous_job_id=model_optimizer_job.job_id
        )
        self._save_job_with_stage(input_shape_analysis_job, session)
        model_analyzer_job = self.create_model_analysis_job(pipeline_id=pipeline.id,
                                                            model_id=self._result_model.id,
                                                            previous_job_id=input_shape_analysis_job.job_id)
        self._save_job_with_stage(model_analyzer_job, session)
        self._model_optimizer_job_id = model_optimizer_job.job_id

    def create_model_optimizer_scan_job(self, pipeline_id: int,
                                        previous_job_id: int = None) -> ModelOptimizerScanJobModel:
        return ModelOptimizerScanJobModel(ModelJobData(
            modelId=self.model_id,
            pipelineId=pipeline_id,
            previousJobId=previous_job_id,
            projectId=None
        ))

    def create_model_optimizer_job(self, pipeline_id: int, previous_job_id: int = None) -> ModelOptimizerScanJobModel:
        return ModelOptimizerJobModel(ModelOptimizerJobData(
            originalTopologyId=self.model_id,
            resultModelId=self._result_model.id,
            pipelineId=pipeline_id,
            previousJobId=previous_job_id,
            projectId=None,
            moArgs=None
        ))

    @property
    def model_optimizer_job_id(self) -> int:
        return self._model_optimizer_job_id

    @property
    def result_model(self) -> TopologiesModel:
        return self._result_model
