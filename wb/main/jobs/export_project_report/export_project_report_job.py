"""
 OpenVINO DL Workbench
 Class for creation job for creating and exporting model report

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
            artifact: DownloadableArtifactsModel = job_model.shared_artifact
            artifact_path = artifact.build_full_artifact_path(ext=self.ext)
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
            artifact = job_model.shared_artifact
            artifact_path = artifact.build_full_artifact_path(ext=self.ext)
        if os.path.isfile(artifact_path):
            os.remove(artifact_path)
        super().on_failure(exception)
