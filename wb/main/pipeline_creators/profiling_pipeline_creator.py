"""
 OpenVINO DL Workbench
 Class for creating ORM profiling pipeline model and dependent models

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
from typing import Optional, List

from wb.main.enumerates import StatusEnum

try:
    from typing import TypedDict
except ImportError:
    from typing_extensions import TypedDict

from sqlalchemy.orm import Session

from wb.main.models import ProfilingJobModel, SingleInferenceInfoModel, PipelineModel
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator


class InferenceParameters(TypedDict):
    batch: int
    nireq: int


class ProfilingConfiguration(TypedDict):
    datasetId: int
    modelId: int
    deviceId: int
    targetId: int
    deviceName: str
    inferences: List[InferenceParameters]
    inferenceTime: int
    projectId: Optional[int]
    numSingleInferences: Optional[int]
    profilingJobId: Optional[int]
    pipelineId: Optional[int]


class ProfilingPipelineCreator(PipelineCreator):
    def __init__(self, configuration: ProfilingConfiguration):
        super().__init__(target_id=configuration['targetId'])
        self.configuration = configuration
        self.configuration['numSingleInferences'] = len(self.configuration['inferences'])

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        raise NotImplementedError

    @property
    def project_id(self) -> Optional[int]:
        return self.configuration.get('projectId')

    @property
    def profiling_job_id(self) -> Optional[int]:
        return self.configuration.get('profilingJobId')

    def create_profiling_job(self, previous_job_id: Optional[int], session: Session) -> ProfilingJobModel:
        project_id = self.configuration['projectId']
        has_ready_profiling = session.query(ProfilingJobModel).filter_by(project_id=project_id,
                                                                         status=StatusEnum.ready).count() > 0
        if not has_ready_profiling:
            auto_benchmark_parameters = InferenceParameters(batch=0, nireq=0)
            self.configuration['inferences'].append(auto_benchmark_parameters)
        profiling_job = ProfilingJobModel(self.configuration)
        profiling_job.parent_job = previous_job_id
        self._save_job_with_stage(profiling_job, session)
        profiling_job.set_data_generation_method()
        profiling_job.write_record(session)
        self.configuration['profilingJobId'] = profiling_job.job_id

        for inference in self.configuration['inferences']:
            batch = inference['batch']
            num_inference_requests = inference['nireq']
            profiling_info = (
                SingleInferenceInfoModel.get_or_create_single_inference_model(batch=batch,
                                                                              nireq=num_inference_requests,
                                                                              project_id=self.project_id,
                                                                              profiling_job_id=self.profiling_job_id,
                                                                              session=session)
            )

            profiling_info.write_record(session)
        return profiling_job
