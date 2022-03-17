"""
 OpenVINO DL Workbench
 Dataset downloader job.

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
from contextlib import closing

from sqlalchemy.orm import Session

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.console_tool_wrapper.datumaro_tool.tool import DatumaroTool
from wb.main.enumerates import JobTypesEnum, StatusEnum, DatumaroModesEnum
from wb.main.jobs.datasets.base_dataset_job import BaseDatasetJob
from wb.main.models import DownloadDatasetJobsModel


class DownloadDatasetJob(BaseDatasetJob):
    job_type = JobTypesEnum.download_dataset_type
    _job_model_class = DownloadDatasetJobsModel

    def run(self):
        self._job_state_subject.update_state(log='Starting Dataset Downloading job',
                                             progress=0, status=StatusEnum.running)

        with closing(get_db_session_for_celery()) as session:
            session: Session
            dataset_recognizer_job: DownloadDatasetJobsModel = self.get_job_model(session)
            dataset: DatasetsModel = dataset_recognizer_job.dataset
            if dataset.status in (StatusEnum.cancelled, StatusEnum.error):
                return



            dataset.write_record(session)
            self._job_state_subject.update_state(status=StatusEnum.ready, progress=100)
            self._job_state_subject.detach_all_observers()

    def _download(self, dataset: DatasetsModel) -> DatasetTypesEnum:
        if not DATASET_RECOGNITION_REPORTS_FOLDER.exists():
            create_empty_dir(DATASET_RECOGNITION_REPORTS_FOLDER)
        report_path = DATASET_RECOGNITION_REPORTS_FOLDER / f'{dataset.id}.json'

        tool = DatumaroTool()
        tool.set_mode(DatumaroModesEnum.download_info)
        tool.set_path('json-report', report_path)
        tool.set_path(None, dataset.path)

        runner = LocalRunner(tool)
        return_code, _ = runner.run_console_tool()
        if return_code:
            self.on_fail(dataset, 'Error during format detection.')
        with open(report_path, 'r') as fp:
            report = json.load(fp)

        detected_formats = report['detected_formats']
        if not detected_formats:
            self.on_fail(dataset, 'No valid dataset format detected.')
        elif len(detected_formats) > 1:
            self.on_fail(dataset, 'More than one valid format detected.')

        dataset_type = DatasetTypesEnum.get_value(detected_formats[0])
        if not dataset_type:
            self.on_fail(dataset, f'Detected format {detected_formats[0]} cannot currently be handled by DL Workbench.')

        return dataset_type

    def on_fail(self, dataset: DatasetsModel, error_message: str):
        remove_dir(dataset.path)
        raise DatumaroError(error_message, self.job_id)
