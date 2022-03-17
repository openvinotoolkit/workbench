"""
 OpenVINO DL Workbench
 Class for getting devices job

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
import json
import os
from contextlib import closing

from wb.error.job_error import SetupTargetError
from wb.main.console_tool_wrapper.sh_tools.parser import ShParser
from wb.main.console_tool_wrapper.sh_tools.tools import PingTargetTool
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.enumerates import JobTypesEnum
from wb.main.jobs.tools_runner.runner_creator import create_runner
from wb.main.jobs.utils.utils import collect_artifacts, fill_ping_parameters
from wb.main.enumerates import StatusEnum
from wb.main.models.get_devices_job_model import GetDevicesJobModel
from wb.main.utils.device_info import load_available_hardware_info
from config.constants import DATA_FOLDER


class GetDevicesJob(IJob):
    job_type = JobTypesEnum.get_devices_type
    _job_model_class = GetDevicesJobModel

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running,
                                             log='Collecting information about available target devices.')
        parser = ShParser(self._job_state_subject)
        tool = PingTargetTool('./scripts/get_inference_engine_devices.sh')
        with closing(get_db_session_for_celery()) as session:
            get_devices_job = self.get_job_model(session)
            bundle_path = get_devices_job.target.bundle_path
            target_id = get_devices_job.target_id
            runner = create_runner(target_id=target_id, tool=tool,
                                   parser=parser, session=session,
                                   working_directory=bundle_path)
            artifact_name = 'DEVICES_INFO.json'
            fill_ping_parameters(target_id, tool, session, artifact_name)

        output_file = tool.get_output_parameter_value

        return_code, message = runner.run_console_tool(self)
        if return_code:
            self.fail_script(message)

        dest_path = os.path.join(DATA_FOLDER, 'targets', str(target_id), artifact_name)

        with closing(get_db_session_for_celery()) as session:
            collect_artifacts(target_id, output_file, dest_path, session)
            with open(dest_path) as devices_information_file:
                devices_information = json.load(devices_information_file)
            self._job_state_subject.update_state(log='Saving information about available target devices.')
            load_available_hardware_info(target_id, devices_information, session)
        self.on_success()

    def fail_script(self, message: str):
        raise SetupTargetError('Cannot collect target devices of the remote target', self._job_id)

    def on_success(self):
        session = get_db_session_for_celery()
        with closing(session):
            self._job_state_subject.update_state(status=StatusEnum.ready,
                                                 log='Collecting of target devices successfully finished.')
            self._job_state_subject.detach_all_observers()
