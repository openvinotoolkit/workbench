"""
 OpenVINO DL Workbench
 Dataset recognizer.

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
import json
from contextlib import closing

from sqlalchemy.orm import Session

from config.constants import DATASET_REPORTS_FOLDER
from wb.error.job_error import DatumaroError
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.datumaro_tool.tool import DatumaroTool
from wb.main.enumerates import JobTypesEnum, StatusEnum, DatumaroModesEnum
from wb.main.jobs.datasets.base_dataset_job import BaseDatasetJob
from wb.main.jobs.tools_runner.local_runner import LocalRunner
from wb.main.models import DatasetsModel, RecognizeDatasetJobsModel
from wb.main.shared.enumerates import DatasetTypesEnum


class RecognizeDatasetJob(BaseDatasetJob):
    job_type = JobTypesEnum.recognize_dataset_type
    _job_model_class = RecognizeDatasetJobsModel

    def run(self):
        self._job_state_subject.update_state(log='Starting Recognizing job', progress=0, status=StatusEnum.running)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            dataset_recognizer_job: RecognizeDatasetJobsModel = self.get_job_model(session)
            dataset: DatasetsModel = dataset_recognizer_job.dataset
            if dataset.status in (StatusEnum.cancelled, StatusEnum.error):
                return
            # Early exit if dataset type is already defined by user
            if not dataset.dataset_type:
                dataset.dataset_type = self._recognize(dataset)
            dataset.write_record(session)
            self._job_state_subject.update_state(status=StatusEnum.ready, progress=100)
            self._job_state_subject.detach_all_observers()

    def _recognize(self, dataset: DatasetsModel) -> DatasetTypesEnum:
        report_path = DATASET_REPORTS_FOLDER / f'{dataset.id}.json'

        tool = DatumaroTool()
        tool.set_mode(DatumaroModesEnum.detect_format)
        tool.set_report_path(report_path)
        tool.set_target(dataset.path)

        runner = LocalRunner(tool)
        return_code, _ = runner.run_console_tool()
        if return_code:
            raise DatumaroError('Error during format detection.', self.job_id)
        with report_path.open() as report_file:
            report = json.load(report_file)

        detected_formats = report['detected_formats']
        if not detected_formats:
            raise DatumaroError('No valid dataset format detected.', self.job_id)
        elif len(detected_formats) > 1:
            raise DatumaroError('More than one valid format detected.', self.job_id)

        try:
            dataset_type = DatasetTypesEnum(detected_formats[0])
        except ValueError:
            raise DatumaroError(f'Detected format {detected_formats[0]} '
                                f'cannot currently be handled by DL Workbench.',
                                self.job_id)

        return dataset_type
