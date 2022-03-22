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
from wb.main.enumerates import PipelineTypeEnum, PipelineStageEnum, AccuracyReportTypeEnum, JobTypesEnum
from wb.main.models import (TargetModel, AccuracyJobsModel, AnnotateDatasetJobModel,
                            DatasetsModel, CreateAccuracyScriptsJobModel, CreateAnnotateDatasetScriptsJobModel,
                            UploadArtifactToTargetJobModel, CreateAccuracyBundleJobModel)
from wb.main.models.accuracy_analysis.annotate_dataset_job_model import AnnotateDatasetJobData
from wb.main.models.accuracy_analysis.create_annotate_dataset_bundle_job_model import \
    CreateAnnotateDatasetBundleJobModel
from wb.main.models.accuracy_model import AccuracyJobData
from wb.main.models.jobs_model import JobData
from wb.main.models.pipeline_model import PipelineModel
from wb.main.pipeline_creators.pipeline_creator import PipelineCreator


class RemotePredictionsRelativeAccuracyReportPipelineCreator(PipelineCreator):
    pipeline_type = PipelineTypeEnum.remote_predictions_relative_accuracy_report

    _job_type_to_stage_map = {
        CreateAnnotateDatasetScriptsJobModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_accuracy_assets,
        CreateAnnotateDatasetBundleJobModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_accuracy_assets,
        UploadArtifactToTargetJobModel.get_polymorphic_job_type(): PipelineStageEnum.uploading_setup_assets,
        AnnotateDatasetJobModel.get_polymorphic_job_type(): PipelineStageEnum.accuracy,
        CreateAccuracyScriptsJobModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_accuracy_assets,
        CreateAccuracyBundleJobModel.get_polymorphic_job_type(): PipelineStageEnum.preparing_accuracy_assets,
        AccuracyJobsModel.get_polymorphic_job_type(): PipelineStageEnum.accuracy,
    }
    _specific_job_model_to_job_type_map = {
        AnnotateDatasetJobModel.get_polymorphic_job_type(): JobTypesEnum.remote_annotate_dataset.value,
        AccuracyJobsModel.get_polymorphic_job_type(): JobTypesEnum.remote_accuracy_type.value
    }

    def __init__(self, project_id: int, target_id: int):
        remote_target_model = TargetModel.query.get(target_id)
        super().__init__(target_id=remote_target_model.id)
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
        upload_artifact_job_id = self._create_pipeline_jobs_for_uploading_bundle(
            pipeline_id=pipeline.id,
            target_id=pipeline.target_id,
            project_id=self.project_id,
            create_job_bundle_model_class=CreateAnnotateDatasetBundleJobModel,
            session=session
        )

        annotate_dataset_job_data = AnnotateDatasetJobData(projectId=self.project_id,
                                                           pipelineId=pipeline.id,
                                                           previousJobId=upload_artifact_job_id,
                                                           resultDatasetId=annotated_dataset.id)
        annotate_dataset_job_model = AnnotateDatasetJobModel(annotate_dataset_job_data)
        self._save_job_with_stage(annotate_dataset_job_model, session)

        create_accuracy_scripts_job_data = JobData(
            projectId=self.project_id,
            pipelineId=pipeline.id,
            previousJobId=annotate_dataset_job_model.job_id)
        create_accuracy_scripts_job = CreateAccuracyScriptsJobModel(create_accuracy_scripts_job_data)
        self._save_job_with_stage(create_accuracy_scripts_job, session)

        previous_job_id = self._create_pipeline_jobs_for_uploading_bundle(
            pipeline_id=pipeline.id,
            target_id=self._target_id,
            project_id=self.project_id,
            previous_job=create_accuracy_scripts_job.job_id,
            create_job_bundle_model_class=CreateAccuracyBundleJobModel,
            session=session
        )
        accuracy_job_data = AccuracyJobData(targetDatasetId=annotated_dataset.id,
                                            reportType=AccuracyReportTypeEnum.parent_model_predictions,
                                            projectId=self.project_id,
                                            pipelineId=pipeline.id,
                                            previousJobId=previous_job_id)
        job = AccuracyJobsModel(accuracy_job_data)
        self._save_job_with_stage(job, session)
