"""
 OpenVINO DL Workbench
 Class for creation job for creating and exporting inference report

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
import csv
import json
import os
from contextlib import closing

from sqlalchemy.orm import Session

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.interfaces.job_observers import ExportInferenceReportDBObserver
from wb.main.models import SingleInferenceInfoModel, DownloadableArtifactsModel, InferenceReportExportJobModel


class InferenceReportExportJob(IJob):
    job_type = JobTypesEnum.export_inference_report
    _job_model_class = InferenceReportExportJobModel
    ext = '.csv'

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        export_project_report_db_observer = ExportInferenceReportDBObserver(job_id=self._job_id)
        self._job_state_subject.attach(export_project_report_db_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(log='Starting inference report creation job.',
                                             status=StatusEnum.running,
                                             progress=0)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job_model: InferenceReportExportJobModel = self.get_job_model(session)
            artifact: DownloadableArtifactsModel = job_model.shared_artifact
            artifact_path = artifact.build_full_artifact_path(ext=self.ext)
            inference_job: SingleInferenceInfoModel = job_model.inference
            per_layer_data = json.loads(inference_job.runtime_representation)
            # create report
            with open(artifact_path, 'w', newline='') as csvfile:
                report_writer = csv.writer(csvfile, delimiter=';')
                report_writer.writerow(
                    ['Execution Order', 'Layer Name', 'Layer Type', 'Execution Time', 'Runtime Precision'])
                for layer in per_layer_data:
                    report_writer.writerow([
                        layer['details'][0]['executionParams']['execOrder'],
                        layer['layerName'],
                        layer['layerType'],
                        layer['execTime'][0] if layer['execTime'][0] != 'not_executed' else 0,
                        layer['runtimePrecision'],
                    ])
            artifact.update(artifact_path)
            artifact.write_record(session)

        self._job_state_subject.update_state(log='Finishing inference report job.', status=StatusEnum.ready,
                                             progress=100)
        self._job_state_subject.detach_all_observers()

    def on_failure(self, exception: Exception):
        with closing(get_db_session_for_celery()) as session:
            job_model = self.get_job_model(session)
            artifact = job_model.downloadable_artifact
            artifact_path = artifact.build_full_artifact_path(ext=self.ext)
        if os.path.isfile(artifact_path):
            os.remove(artifact_path)
        super().on_failure(exception)
