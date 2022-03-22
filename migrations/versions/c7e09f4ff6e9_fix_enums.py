"""Fix enums

Revision ID: c7e09f4ff6e9
Revises: 17cec5304757
Create Date: 2022-01-21 10:57:39.937180

"""

"""
 OpenVINO DL Workbench
 Migration: Fix enums

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
import sqlalchemy as sa


# revision identifiers, used by Alembic.
from migrations.utils import SQLEnumMigrator

revision = 'c7e09f4ff6e9'
down_revision = '17cec5304757'
branch_labels = None
depends_on = None


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
    'generate_dataset',
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
)

new_pipeline_stages = tuple(
    {*old_pipeline_stages, 'validate_tokenizer', 'wait_tokenizer_upload'} - {'generate_dataset'}
)

pipeline_stage_enum_migrator = SQLEnumMigrator(
    table_column_pairs=(('job_execution_details', 'stage'),),
    enum_name='pipelinestageenum',
    from_types=old_pipeline_stages,
    to_types=new_pipeline_stages
)

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
    'generate_dataset',
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
    'configure_model'
)

new_pipeline_types = tuple(
    {*old_pipeline_types, 'create_int8_calibration_bundle', 'upload_tokenizer'} - {'generate_dataset'}
)

pipeline_type_enum_migrator = SQLEnumMigrator(
    table_column_pairs=(('pipelines', 'type'),),
    enum_name='pipelinetypeenum',
    from_types=old_pipeline_types,
    to_types=new_pipeline_types
)


def upgrade():
    SQLEnumMigrator.enable_enum_check = True
    pipeline_stage_enum_migrator.upgrade()
    pipeline_type_enum_migrator.upgrade()


def downgrade():
    pipeline_stage_enum_migrator.downgrade()
    pipeline_type_enum_migrator.downgrade()
    SQLEnumMigrator.enable_enum_check = False
