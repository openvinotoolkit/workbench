"""
 OpenVINO DL Workbench
 Class for parsing DevCloud annotate dataset job result

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
import logging as log
import tarfile
from contextlib import closing
from pathlib import Path

from sqlalchemy.orm import Session

from wb.error.job_error import ManualTaskRetryException
from wb.extensions_factories.database import get_db_session_for_celery
from wb.main.enumerates import JobTypesEnum, StatusEnum
from wb.main.jobs.accuracy_analysis.accuracy.accuracy_job_state import AccuracyJobStateSubject
from wb.main.jobs.accuracy_analysis.annotate_datset.annotate_dataset_db_observer import AnnotateDatasetDBObserver
from wb.main.jobs.interfaces.ijob import IJob
from wb.main.jobs.interfaces.job_observers import ParseDevCloudAnnotateDatasetResultDBObserver
from wb.main.models import (ProjectsModel, DatasetsModel, DownloadableArtifactsModel, AnnotateDatasetJobModel,
                            ParseDevCloudDatasetAnnotationResultJobModel)
from wb.main.shared.enumerates import TaskEnum
from wb.main.utils.utils import create_empty_dir


class ParseDevCloudAnnotateDatasetResultJob(IJob):
    job_type = JobTypesEnum.parse_dev_cloud_dataset_annotation_result_job
    _job_model_class = ParseDevCloudDatasetAnnotationResultJobModel
    _job_state_subject: AccuracyJobStateSubject

    def __init__(self, job_id: int, **unused_kwargs):
        super().__init__(job_id=job_id)
        database_observer = ParseDevCloudAnnotateDatasetResultDBObserver(job_id=self._job_id)
        self._job_state_subject.attach(database_observer)
        self._attach_default_db_and_socket_observers()

    def run(self):
        self._job_state_subject.update_state(status=StatusEnum.running, progress=0,
                                             log='Starting parse DevCloud annotate dataset result job')
        with closing(get_db_session_for_celery()) as session:
            session: Session
            parse_accuracy_result_job_model: ParseDevCloudDatasetAnnotationResultJobModel = self.get_job_model(session)
            annotate_dataset_job_model: AnnotateDatasetJobModel = next(
                filter(
                    lambda job: job.job_type == JobTypesEnum.annotate_dataset.value,
                    parse_accuracy_result_job_model.pipeline.jobs
                )
            )

            project: ProjectsModel = annotate_dataset_job_model.project
            task_type = project.topology.meta.task_type
            result_dataset: DatasetsModel = parse_accuracy_result_job_model.auto_annotated_dataset

            result_artifact: DownloadableArtifactsModel = parse_accuracy_result_job_model.result_artifact
            if not result_artifact.is_all_files_uploaded:
                raise ManualTaskRetryException('Accuracy result artifact is not uploaded yet, retry task')

            artifact_path = result_artifact.files[0].path
            result_artifacts_path = result_dataset.path

            log.debug('Parsing accuracy result artifact and saving data to database')
            self._extract_artifact(artifact_path, result_artifacts_path)
            self._process_dataset(result_dataset, task_type, session)
        self.on_success()

    @staticmethod
    def _extract_artifact(archive_path: str, destination_path: Path):
        create_empty_dir(destination_path)
        with tarfile.open(archive_path, 'r:gz') as tar:
            
            import os
            
            def is_within_directory(directory, target):
                
                abs_directory = os.path.abspath(directory)
                abs_target = os.path.abspath(target)
            
                prefix = os.path.commonprefix([abs_directory, abs_target])
                
                return prefix == abs_directory
            
            def safe_extract(tar, path=".", members=None, *, numeric_owner=False):
            
                for member in tar.getmembers():
                    member_path = os.path.join(path, member.name)
                    if not is_within_directory(path, member_path):
                        raise Exception("Attempted Path Traversal in Tar File")
            
                tar.extractall(path, members, numeric_owner=numeric_owner) 
                
            
            safe_extract(tar, destination_path)

    def on_success(self):
        self._job_state_subject.update_state(status=StatusEnum.ready,
                                             log='Parse DevCloud accuracy result job successfully finished')
        self._job_state_subject.detach_all_observers()

    def _process_dataset(self, dataset: DatasetsModel, task_type: TaskEnum, session: Session):
        AnnotateDatasetDBObserver._fill_dataset_data(dataset, task_type, session)
