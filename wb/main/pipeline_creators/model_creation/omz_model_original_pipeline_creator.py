"""
 OpenVINO DL Workbench
 Class for omz original model download pipeline creator

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
from sqlalchemy.orm import Session

from wb.main.enumerates import PipelineStageEnum
from wb.main.environment.manifest import ManifestFactory, ManifestDumper
from wb.main.models import (PipelineModel, OMZModelDownloadJobModel, OMZModelConvertJobModel, OMZModelMoveJobModel,
                            TopologyAnalysisJobsModel, SetupEnvironmentJobModel, AnalyzeModelInputShapeJobModel)
from wb.main.pipeline_creators.model_creation.base_omz_model_pipeline_creator import BaseOMZModelPipelineCreator
from wb.main.utils.utils import create_empty_dir


class OMZModelOriginalPipelineCreator(BaseOMZModelPipelineCreator):
    _job_type_to_stage_map = {
        OMZModelDownloadJobModel.get_polymorphic_job_type(): PipelineStageEnum.download_omz_model,
        SetupEnvironmentJobModel.get_polymorphic_job_type(): PipelineStageEnum.setup_environment,
        OMZModelConvertJobModel.get_polymorphic_job_type(): PipelineStageEnum.convert_omz_model,
        OMZModelMoveJobModel.get_polymorphic_job_type(): PipelineStageEnum.move_omz_model,
        AnalyzeModelInputShapeJobModel.get_polymorphic_job_type(): PipelineStageEnum.model_analyzer,
        TopologyAnalysisJobsModel.get_polymorphic_job_type(): PipelineStageEnum.model_analyzer,
    }

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        self._create_result_model(session)
        download_job_record = self.create_download_job(pipeline_id=pipeline.id)
        self._save_job_with_stage(download_job_record, session)
        create_environment_job = self.create_environment_setup_job(model_id=self._result_model.id,
                                                                   previous_job_id=download_job_record.job_id,
                                                                   session=session)

        convert_job_record = self.create_convert_job(pipeline_id=pipeline.id,
                                                     previous_job_id=create_environment_job.job_id)
        self._save_job_with_stage(convert_job_record, session)

        move_model_job = self.create_move_model_job(pipeline_id=pipeline.id, previous_job_id=convert_job_record.job_id)

        self._save_job_with_stage(move_model_job, session)
        input_shape_analysis_job = self.create_model_input_shape_analysis_job(
            pipeline_id=pipeline.id,
            model_id=self._result_model.id,
            previous_job_id=move_model_job.job_id
        )
        self._save_job_with_stage(input_shape_analysis_job, session)
        model_analysis_job = self.create_model_analysis_job(pipeline_id=pipeline.id,
                                                            model_id=self._result_model.id,
                                                            previous_job_id=input_shape_analysis_job.job_id)
        self._save_job_with_stage(model_analysis_job, session)

        create_empty_dir(self.result_model.path)
        manifest = ManifestFactory.create_topology_specific(self.result_model)
        ManifestDumper.dump_to_yaml(manifest)
        self.result_model.manifest_path = str(manifest.path)
        self.result_model.write_record(session)
