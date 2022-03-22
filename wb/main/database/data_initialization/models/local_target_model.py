"""
 OpenVINO DL Workbench
 Init local target data

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

from wb.main.models.cpu_info_model import CPUInfoModel
from wb.main.models.local_target_model import LocalTargetModel
from wb.main.models.system_resources_model import SystemResourcesModel
from wb.main.scripts.get_system_resources import get_ram_usage, get_disk_usage
from wb.main.utils.cpu_info_parser import CPUInfoParser


def init(session: Session):
    if session.query(LocalTargetModel).first():
        return

    system_resources_record = SystemResourcesModel()
    update_system_resources(system_resources_record, session)
    system_resources_record.write_record(session)
    cpu_full_name = CPUInfoParser.get_cpu_full_name()
    parsed_cpu_info = CPUInfoParser.parse_cpu_full_name(cpu_full_name)
    cpu_info_record = CPUInfoModel(name=cpu_full_name,
                                   platform_type=parsed_cpu_info['platform'],
                                   processor_family=parsed_cpu_info['processor_family'],
                                   processor_number=parsed_cpu_info['processor_number'],
                                   cores_number=CPUInfoParser.get_cpu_cores_number(),
                                   frequency=CPUInfoParser.get_cpu_frequency())
    cpu_info_record.write_record(session)
    local_target = LocalTargetModel(cpu_info_id=cpu_info_record.id, system_resources_id=system_resources_record.id)
    local_target.write_record(session)


def update_system_resources(system_resources: SystemResourcesModel, session: Session):
    system_info = {
        'RAM': get_ram_usage(),
        'DISK': get_disk_usage(),
    }
    system_resources.update(system_info, session=session)
