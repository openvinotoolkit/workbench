"""
 OpenVINO DL Workbench
 Class for creating ORM FP model annotation report pipeline model and dependent models

 Copyright (c) 2021 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
