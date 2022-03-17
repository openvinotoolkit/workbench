"""
 OpenVINO DL Workbench
 Class for creation job for creating and exporting model report

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
import os
from contextlib import closing
from typing import List

from sqlalchemy.orm import Session

from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.interfaces.job_observers import ExportProjectReportDBObserver
from wb.main.models import ProjectReportExportJobModel, DownloadableArtifactsModel, SingleInferenceInfoModel


class ProjectReportExportJob(IJob):
    job_type = JobTypesEnum.export_project_report
    _job_model_class = ProjectReportExportJobModel
    ext = '.csv'

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        export_project_report_db_observer = ExportProjectReportDBObserver(job_id=self._job_id)
        self._job_state_subject.attach(export_project_report_db_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(log='Starting project report creation job.', status=StatusEnum.running,
                                             progress=0)
        with closing(get_db_session_for_celery()) as session:
            session: Session
            job_model: ProjectReportExportJobModel = self.get_job_model(session)
            artifact: DownloadableArtifactsModel = job_model.downloadable_artifact
            artifact_path = DownloadableArtifactsModel.get_archive_path(artifact_id=artifact.id, ext=self.ext)
            inferences: List[SingleInferenceInfoModel] = session.query(SingleInferenceInfoModel). \
                filter(SingleInferenceInfoModel.project_id == job_model.project_id). \
                filter(SingleInferenceInfoModel.status == StatusEnum.ready). \
                all()
            # create report
            with open(artifact_path, 'w', newline='') as csvfile:
                report_writer = csv.writer(csvfile, delimiter=';')
                if not inferences:
                    report_writer.writerow(['No data available'])
                    self.on_success(artifact, artifact_path)
                    return
                report_writer.writerow(['Stream', 'Batch size', 'Throughput', 'Latency'])
                for inference in sorted(inferences, key=lambda infer: infer.last_modified):
                    report_writer.writerow([inference.nireq, inference.batch, inference.throughput, inference.latency])
            self.on_success(artifact, artifact_path)

    def on_success(self, artifact: DownloadableArtifactsModel, path: str):
        artifact.update(path)
        self._job_state_subject.update_state(log='Finishing project report job.', status=StatusEnum.ready, progress=100)
        self._job_state_subject.detach_all_observers()

    def on_failure(self, exception: Exception):
        with closing(get_db_session_for_celery()) as session:
            job_model = self.get_job_model(session)
            artifact = job_model.downloadable_artifact
            artifact_path = DownloadableArtifactsModel.get_archive_path(artifact_id=artifact.id, ext=self.ext)
        if os.path.isfile(artifact_path):
            os.remove(artifact_path)
        super().on_failure(exception)
