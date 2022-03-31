"""
 OpenVINO DL Workbench
 Class for converting uploaded dataset via Datumaro

 Copyright (c) 2021 Intel Corporation

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

from sqlalchemy.orm import Session

from config.constants import UPLOAD_FOLDER_DATASETS
from wb.error.job_error import DatumaroError
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.datumaro_tool.tool import DatumaroTool
from wb.main.enumerates import DatumaroModesEnum, JobTypesEnum, StatusEnum
from wb.main.jobs.datasets.base_dataset_job import BaseDatasetJob
from wb.main.jobs.tools_runner.local_runner import LocalRunner
from wb.main.models import DatasetsModel, ConvertDatasetJobsModel


from wb.main.shared.enumerates import DatasetTypesEnum
from wb.main.utils.utils import remove_dir


class ConvertDatasetJob(BaseDatasetJob):
    job_type = JobTypesEnum.convert_dataset_type
    _job_model_class = ConvertDatasetJobsModel

    # A map defining most appropriate formats to convert to using the tool
    _format_conversion_map = {
        DatasetTypesEnum.imagenet: DatasetTypesEnum.imagenet_txt,
        DatasetTypesEnum.cityscapes: DatasetTypesEnum.voc_segmentation,
    }

    # A map for backwards conversion between Datumaro-specific formats and Workbench-supported ones
    _format_compatibility_map = {
        DatasetTypesEnum.voc_segmentation: DatasetTypesEnum.voc
    }

    def run(self):
        self._job_state_subject.update_state(log='Starting Datumaro conversion job',
                                             progress=0, status=StatusEnum.running)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            dataset_converter_job: ConvertDatasetJobsModel = self.get_job_model(session)
            dataset: DatasetsModel = dataset_converter_job.dataset
            original_format: DatasetTypesEnum = dataset.dataset_type
            converted_dataset: DatasetsModel = dataset_converter_job.converted_dataset
            if dataset.status in (StatusEnum.cancelled, StatusEnum.error):
                return

            dataset_converter_job.original_format = original_format
            converted_dataset.path = os.path.join(UPLOAD_FOLDER_DATASETS, str(converted_dataset.id))
            if os.path.exists(converted_dataset.path):
                remove_dir(converted_dataset.path)
            # Check if dataset requires conversion, copy to the new artifact if it doesnt
            if original_format not in self._format_conversion_map:
                self.skip_conversion(dataset, converted_dataset, original_format)
            else:
                self.run_conversion(dataset, converted_dataset, original_format)

            converted_dataset.write_record(session)
            self.on_success()

    def skip_conversion(self, original_dataset: DatasetsModel,
                        result_dataset: DatasetsModel,
                        dataset_format: DatasetTypesEnum):
        shutil.copytree(original_dataset.path, result_dataset.path)

        result_format = self._format_compatibility_map.get(dataset_format, dataset_format)
        result_dataset.dataset_type = result_format

    def run_conversion(self, original_dataset: DatasetsModel,
                       result_dataset: DatasetsModel,
                       dataset_format: DatasetTypesEnum):
        tool = DatumaroTool()
        tool.set_mode(DatumaroModesEnum.convert)
        tool.set_input_path(original_dataset.path)
        tool.set_output_path(result_dataset.path)
        tool.set_conversion(dataset_format, self._format_conversion_map[dataset_format])
        tool.add_separator()
        tool.enable_image_save()

        runner = LocalRunner(tool)
        return_code, _ = runner.run_console_tool()
        if return_code:
            raise DatumaroError('Error during Datumaro conversion.', self.job_id)

        result_format = self._format_compatibility_map.get(self._format_conversion_map[dataset_format],
                                                           self._format_conversion_map[dataset_format])
        result_dataset.dataset_type = result_format

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready, progress=100)
        self._job_state_subject.detach_all_observers()
