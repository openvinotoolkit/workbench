"""
 OpenVINO DL Workbench
 Class for creating ORM ping pipeline model and dependent models

 Copyright (c) 2020 Intel Corporation

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
