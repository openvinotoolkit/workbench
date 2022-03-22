"""deprecate_winograd

Revision ID: da69e89ee524
Revises: c7e09f4ff6e9
Create Date: 2022-01-26 10:55:03.572867

"""

"""
 OpenVINO DL Workbench
 Migration: Deprecate Winograd

 Copyright (c) 2022 Intel Corporation

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
from alembic import op
from migrations.utils import SQLEnumMigrator

# revision identifiers, used by Alembic.
revision = 'da69e89ee524'
down_revision = 'c7e09f4ff6e9'
branch_labels = None
depends_on = None

old_pipeline_types = (
    'local_accuracy',
    'remote_accuracy',
    'dev_cloud_accuracy',
    'remote_profiling',
    'local_profiling',
    'dev_cloud_profiling',
    'local_int8_calibration',
    'remote_int8_calibration',
    'dev_cloud_int8_calibration',
    'create_profiling_bundle',
    'download_log',
    'download_model',
    'deployment_manager',
    'export_project',
    'setup',
    'ping',
    'inference_test_image',
    'upload_dataset',
    'upload_model',
    'download_omz_model',
    'export_project_report',
    'export_inference_report',
    'local_winograd_tuning',
    'local_per_tensor_report',
    'remote_per_tensor_report',
    'local_predictions_relative_accuracy_report',
    'remote_predictions_relative_accuracy_report',
    'dev_cloud_predictions_relative_accuracy_report',
    'dev_cloud_per_tensor_report',
    'configure_model',
    'create_int8_calibration_bundle',
    'upload_tokenizer',
)

new_pipeline_types = tuple(set(old_pipeline_types) - {'local_winograd_tuning'})

pipeline_type_enum_migrator = SQLEnumMigrator(
    table_column_pairs=(('pipelines', 'type'),),
    enum_name='pipelinetypeenum',
    from_types=old_pipeline_types,
    to_types=new_pipeline_types
)

old_pipeline_stages = (
    'accuracy',
    'preparing_setup_assets',
    'uploading_setup_assets',
    'configuring_environment',
    'collecting_available_devices',
    'collecting_system_information',
    'preparing_profiling_assets',
    'preparing_int8_calibration_assets',
    'preparing_accuracy_assets',
    'profiling',
    'getting_remote_job_result',
    'download_log',
    'int8_calibration',
    'remote_int8_calibration',
    'augment_dataset',
    'extract_dataset',
    'recognize_dataset',
    'validate_dataset',
    'wait_dataset_upload',
    'export_project_report',
    'export_inference_report',
    'wait_model_upload',
    'model_analyzer',
    'model_optimizer_scan',
    'convert_keras_model',
    'convert_model',
    'setup_environment',
    'download_omz_model',
    'convert_omz_model',
    'move_omz_model',
    'inference_test_image',
    'export_project',
    'winograd_tuning',
    'extract_text_dataset',
    'validate_text_dataset',
    'convert_dataset',
    'preparing_reshape_model_assets',
    'reshape_model',
    'apply_model_layout',
    'validate_tokenizer',
    'wait_tokenizer_upload',
)

new_pipeline_stages = tuple(set(old_pipeline_stages) - {'winograd_tuning'})

pipeline_stage_enum_migrator = SQLEnumMigrator(
    table_column_pairs=(('job_execution_details', 'stage'),),
    enum_name='pipelinestageenum',
    from_types=old_pipeline_stages,
    to_types=new_pipeline_stages
)


def upgrade():
    #  Migration checklist:
    #  [x] 1. Remove winograd from pipeline type enum
    #  [x] 2. Remove winograd from pipeline stage enum
    #  [x] 4. Remove winograd job model schema (winograd_tune_jobs table)
    #  [x] 5. Remove is_winograd column from TopologyAnalysisJobsModel (topology_analysis_jobs table)
    #  [x] 6. Migrate data:
    #       [x] - Set job type to base 'job' for winograd pipeline jobs to support removed polymorphic identity
    #       [x] - Change type of winograd pipelines to profiling
    #       [x] - Change deprecated stage from winograd_tune to model_analyzer in job_execution_details table
    #       [x] - Set winograd topologies as archived

    # Data migration
    op.execute("UPDATE jobs SET job_type='job' WHERE job_type='WinogradTuneJob';")
    op.execute("UPDATE pipelines SET type='local_profiling' WHERE type='local_winograd_tuning';")
    op.execute("UPDATE job_execution_details SET stage='model_analyzer' WHERE stage='winograd_tuning';")
    op.execute("UPDATE artifacts SET status='archived' FROM projects p "
               "WHERE p.model_id = artifacts.id AND artifacts.status='ready' AND p.optimization_type='winograd_tune';")

    # Enum migration
    SQLEnumMigrator.enable_enum_check = True
    pipeline_type_enum_migrator.upgrade()
    pipeline_stage_enum_migrator.upgrade()

    # Schema migration
    op.drop_column('topology_analysis_jobs', 'is_winograd')

    op.drop_constraint('winograd_autotune_jobs_result_model_id_fkey', 'winograd_tune_jobs', type_='foreignkey')
    op.drop_constraint('winograd_autotune_jobs_job_id_fkey', 'winograd_tune_jobs', type_='foreignkey')
    op.drop_constraint('winograd_autotune_jobs_pkey', 'winograd_tune_jobs', type_='primary')
    op.drop_table('winograd_tune_jobs')


def downgrade():
    raise NotImplementedError(f'Downgrade is not implemented for {revision}')
