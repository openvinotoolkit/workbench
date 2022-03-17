"""
 OpenVINO DL Workbench
 Class for creating ORM local profiling pipeline model and dependent models

 Copyright (c) 2020 Intel Corporation

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

from wb.main.enumerates import PipelineTypeEnum, PipelineStageEnum
from wb.main.models import CreateProfilingScriptsJobModel, PipelineModel, ProfilingJobModel
from wb.main.pipeline_creators.profiling_pipeline_creator import ProfilingPipelineCreator


class LocalProfilingPipelineCreator(ProfilingPipelineCreator):
    pipeline_type = PipelineTypeEnum.local_profiling

    _job_type_to_stage_map = {
        CreateProfilingScriptsJobModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_profiling_assets,
        ProfilingJobModel.get_polymorphic_job_type(): PipelineStageEnum.profiling,
    }

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        project_id = self.create_project_and_save_to_configuration(configuration=self.configuration,
                                                                   session=session)
        self.configuration['projectId'] = project_id
        if 'pipelineId' not in self.configuration:
            self.configuration['pipelineId'] = pipeline.id
        create_profiling_scripts_job = CreateProfilingScriptsJobModel(self.configuration)
        self._save_job_with_stage(create_profiling_scripts_job, session)
        self.create_profiling_job(previous_job_id=create_profiling_scripts_job.job_id,
                                  session=session)
