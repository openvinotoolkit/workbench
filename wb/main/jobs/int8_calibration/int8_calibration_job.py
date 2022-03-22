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
import os
import shutil
from contextlib import closing
from pathlib import Path

from sqlalchemy.orm import Session

from config.constants import INTERMEDIATE_DIR_FOR_AA_ALGORITHM, POT_RESULT_OPTIMIZED_DIR
from wb.error.job_error import Int8CalibrationError
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.post_training_optimization.console_output_parser import \
    PostTrainingOptimizationParser
from wb.main.console_tool_wrapper.workbench_job_tool import WorkbenchJobTool
from wb.main.enumerates import StatusEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.interfaces.job_observers import Int8CalibrationDBObserver
from wb.main.jobs.tools_runner.runner_creator import create_runner
from wb.main.models import Int8CalibrationJobModel, ProjectsModel
from wb.main.utils.utils import find_by_ext, remove_dir


class Int8CalibrationJob(IJob):
    _job_model_class = Int8CalibrationJobModel

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        with closing(get_db_session_for_celery()) as session:
            self.openvino_bundle_path = self.get_openvino_bundle_path(session)

        database_observer = Int8CalibrationDBObserver(job_id=self._job_id)
        self._job_state_subject.attach(database_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, progress=0)
        with closing(get_db_session_for_celery()) as session:
            int8_job_model = self.get_job_model(session)
            project: ProjectsModel = int8_job_model.project
            target_id = project.target_id

            tool = self.create_calibration_tool(int8_job_model)

            parser = PostTrainingOptimizationParser(self._job_state_subject)

            runner = create_runner(target_id=target_id, tool=tool,
                                   parser=parser, session=session,
                                   working_directory=self.openvino_bundle_path)

        return_code, output = runner.run_console_tool(self, measure_performance=True)
        if return_code:
            raise Int8CalibrationError(output, self._job_id)

        self.on_success()

    @staticmethod
    def move_optimized_model(source_path: str, result_path: str, job_id: int):
        for file_name in os.listdir(source_path):
            if INTERMEDIATE_DIR_FOR_AA_ALGORITHM in file_name:
                file_path = os.path.join(source_path, file_name)
                shutil.rmtree(file_path)
                break
        try:
            optimized_model_path = os.path.join(source_path, POT_RESULT_OPTIMIZED_DIR)

            xml_path = find_by_ext(optimized_model_path, 'xml', recursive=True)
            bin_path = find_by_ext(optimized_model_path, 'bin', recursive=True)
        except StopIteration:
            raise Int8CalibrationError('Cannot find output artifacts of Post-training optimization toolkit', job_id)
        os.makedirs(result_path, exist_ok=True)
        shutil.move(xml_path, os.path.join(result_path, os.path.basename(xml_path)))
        shutil.move(bin_path, os.path.join(result_path, os.path.basename(bin_path)))
        optimized_subdir = Path(xml_path).parent
        # Remove empty folder
        remove_dir(os.path.join(result_path, optimized_subdir))

    def on_success(self):
        self.collect_artifacts()
        self._job_state_subject.update_state(status=StatusEnum.ready)

    def create_calibration_tool(self, job: Int8CalibrationJobModel) -> WorkbenchJobTool:
        raise NotImplementedError

    def get_openvino_bundle_path(self, session: Session) -> str:
        raise NotImplementedError

    def collect_artifacts(self):
        raise NotImplementedError

    def _clean_paths(self):
        raise NotImplementedError
