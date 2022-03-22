"""
 OpenVINO DL Workbench
 Class for creating ORM FP model annotation report pipeline model and dependent models

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
from sqlalchemy.orm import Session

from config.constants import UPLOAD_FOLDER_DATASETS
from wb.main.enumerates import PipelineTypeEnum, PipelineStageEnum, TargetTypeEnum, AccuracyReportTypeEnum
from wb.main.models import (TargetModel, AccuracyJobsModel, AnnotateDatasetJobModel,
                            DatasetsModel, CreateAccuracyScriptsJobModel, CreateAnnotateDatasetScriptsJobModel)
from wb.main.models.accuracy_analysis.annotate_dataset_job_model import AnnotateDatasetJobData
from wb.main.models.accuracy_model import AccuracyJobData
from wb.main.models.jobs_model import JobData
from wb.main.models.pipeline_model import PipelineModel
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator


class LocalPredictionsRelativeAccuracyReportPipelineCreator(PipelineCreator):
    pipeline_type = PipelineTypeEnum.local_predictions_relative_accuracy_report

    _job_type_to_stage_map = {
        CreateAnnotateDatasetScriptsJobModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_accuracy_assets,
        AnnotateDatasetJobModel.get_polymorphic_job_type(): PipelineStageEnum.accuracy,
        CreateAccuracyScriptsJobModel.get_polymorphic_job_type(): PipelineStageEnum.accuracy,
        AccuracyJobsModel.get_polymorphic_job_type(): PipelineStageEnum.accuracy,
    }

    def __init__(self, project_id: int):
        local_target_model = TargetModel.query.filter_by(target_type=TargetTypeEnum.local).first()
        super().__init__(local_target_model.id)
        self.project_id = project_id

    def _create_pipeline_jobs(self, pipeline: PipelineModel, session: Session):
        annotated_dataset = DatasetsModel.create_dataset(dataset_name='annotated_dataset', files=None,
                                                         upload_path=UPLOAD_FOLDER_DATASETS, is_auto_annotated=True)
        create_dataset_annotation_script = CreateAnnotateDatasetScriptsJobModel(JobData(
            projectId=self.project_id,
            pipelineId=pipeline.id,
            previousJobId=None
        ))
        self._save_job_with_stage(create_dataset_annotation_script, session)
        annotate_dataset_job_data = AnnotateDatasetJobData(projectId=self.project_id,
                                                           pipelineId=pipeline.id,
                                                           previousJobId=create_dataset_annotation_script.job_id,
                                                           resultDatasetId=annotated_dataset.id)
        annotate_dataset_job_model = AnnotateDatasetJobModel(annotate_dataset_job_data)
        self._save_job_with_stage(annotate_dataset_job_model, session)

        create_accuracy_scripts_job_data = JobData(
            projectId=self.project_id,
            pipelineId=pipeline.id,
            previousJobId=annotate_dataset_job_model.job_id
        )
        create_accuracy_scripts_job = CreateAccuracyScriptsJobModel(create_accuracy_scripts_job_data)
        self._save_job_with_stage(create_accuracy_scripts_job, session)

        accuracy_job_data = AccuracyJobData(targetDatasetId=annotated_dataset.id,
                                            reportType=AccuracyReportTypeEnum.parent_model_predictions,
                                            projectId=self.project_id,
                                            pipelineId=pipeline.id,
                                            previousJobId=create_accuracy_scripts_job.job_id)
        accuracy_job_model = AccuracyJobsModel(accuracy_job_data)
        self._save_job_with_stage(accuracy_job_model, session)
