"""
 OpenVINO DL Workbench
 Class for creating ORM ping pipeline model and dependent models

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
from wb.main.models.get_devices_job_model import GetDevicesJobModel
from wb.main.models.get_system_resources_job_model import GetSystemResourcesJobModel
from wb.main.models.pipeline_model import PipelineModel
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator


class PingPipelineCreator(PipelineCreator):
    pipeline_type = PipelineTypeEnum.ping

    _job_type_to_stage_map = {
        GetDevicesJobModel.get_polymorphic_job_type(): PipelineStageEnum.collecting_available_devices,
        GetSystemResourcesJobModel.get_polymorphic_job_type(): PipelineStageEnum.collecting_system_information,
    }

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        get_devices_job_model = GetDevicesJobModel({
            'targetId': pipeline.target_id,
            'pipelineId': pipeline.id,
        })
        self._save_job_with_stage(get_devices_job_model, session)

        get_system_resources_job_model = GetSystemResourcesJobModel({
            'targetId': pipeline.target_id,
            'pipelineId': pipeline.id,
            'previousJobId': get_devices_job_model.job_id
        })
        self._save_job_with_stage(get_system_resources_job_model, session)
