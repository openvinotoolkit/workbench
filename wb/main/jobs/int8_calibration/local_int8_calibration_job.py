"""
 OpenVINO DL Workbench
 Class for int8 calibration job

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
from contextlib import closing

from sqlalchemy.orm import Session

from config.constants import OPENVINO_ROOT_PATH
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.workbench_job_tool import WorkbenchJobTool
from wb.main.enumerates import JobTypesEnum
from wb.main.jobs.int8_calibration.int8_calibration_job import Int8CalibrationJob
from wb.main.jupyter_notebooks.update_jupyter_notebook_decorator import update_jupyter_notebook_job
from wb.main.models import Int8CalibrationJobModel, CreateInt8CalibrationScriptsJobModel


@update_jupyter_notebook_job
class LocalInt8CalibrationJob(Int8CalibrationJob):
    job_type = JobTypesEnum.int8calibration_type

    def create_calibration_tool(self, job: Int8CalibrationJobModel) -> WorkbenchJobTool:
        create_int8_scripts_job_model: CreateInt8CalibrationScriptsJobModel = job.pipeline.get_job_by_type(
            job_type=CreateInt8CalibrationScriptsJobModel.get_polymorphic_job_type()
        )
        return WorkbenchJobTool(job_script_path=create_int8_scripts_job_model.job_script_file_path,
                                openvino_package_root_path=self.openvino_bundle_path,
                                job_bundle_path=create_int8_scripts_job_model.scripts_path)

    def get_openvino_bundle_path(self, session: Session) -> str:
        return OPENVINO_ROOT_PATH

    def collect_artifacts(self):
        with closing(get_db_session_for_celery()) as session:
            job_model: Int8CalibrationJobModel = self.get_job_model(session)
            project = job_model.project
            topology_path = project.topology.path
            create_int8_scripts_job_model: CreateInt8CalibrationScriptsJobModel = job_model.pipeline.get_job_by_type(
                job_type=CreateInt8CalibrationScriptsJobModel.get_polymorphic_job_type()
            )
        self.move_optimized_model(source_path=create_int8_scripts_job_model.job_artifacts_path,
                                  result_path=topology_path,
                                  job_id=self.job_id)
