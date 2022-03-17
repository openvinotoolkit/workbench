"""Enable Datumaro conversion for uploaded datasets

Revision ID: af29f21e2ea5
Revises: 15a8e6df8989
Create Date: 2021-11-02 03:33:37.494569

"""

"""
 OpenVINO DL Workbench
 Migration: Enable Datumaro conversion job and dataset relations

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
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from migrations.utils.sql_enum_migrator import SQLEnumMigrator

# revision identifiers, used by Alembic.
revision = 'af29f21e2ea5'
down_revision = '15a8e6df8989'
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
    'validate_tokenizer',
    'wait_tokenizer_upload'
)

new_pipeline_stages = (
    *old_pipeline_stages,
    'convert_dataset',
)

old_dataset_types = (
    'imagenet',
    'voc',
    'coco',
    'common_semantic_segmentation',
    'common_super_resolution',
    'lfw',
    'vggface2',
    'wider_face',
    'open_images',
    'csv',
    'not_annotated',
)

temp_dataset_types = (
    *old_dataset_types,
    'voc_segmentation',
    'vgg_face2',
    'cityscapes',
    'imagenet_txt',
)

new_dataset_types = tuple(set(temp_dataset_types) - {'vggface2'})

temp_dataset_type_enum_migrator = SQLEnumMigrator(
    table_column_pairs=(('datasets', 'dataset_type'),),
    enum_name='datasettypesenum',
    from_types=old_dataset_types,
    to_types=temp_dataset_types
)

new_dataset_type_enum_migrator = SQLEnumMigrator(
    table_column_pairs=(('datasets', 'dataset_type'),),
    enum_name='datasettypesenum',
    from_types=temp_dataset_types,
    to_types=new_dataset_types
)

pipeline_stage_enum_migrator = SQLEnumMigrator(
    table_column_pairs=(('job_execution_details', 'stage'),),
    enum_name='pipelinestageenum',
    from_types=old_pipeline_stages,
    to_types=new_pipeline_stages
)

dataset_types_enum = postgresql.ENUM(*new_dataset_types, name='datasettypesenum', create_type=False)


def upgrade():
    temp_dataset_type_enum_migrator.upgrade()
    op.execute("UPDATE datasets SET dataset_type = 'imagenet_txt' WHERE dataset_type = 'imagenet';")
    op.execute("UPDATE datasets SET dataset_type = 'vgg_face2' WHERE dataset_type = 'vggface2';")
    new_dataset_type_enum_migrator.upgrade()

    pipeline_stage_enum_migrator.upgrade()

    op.create_table('convert_dataset_jobs',
                    sa.Column('job_id', sa.Integer(), autoincrement=True, nullable=False),
                    sa.Column('dataset_id', sa.Integer(), nullable=False),
                    sa.Column('original_format', dataset_types_enum, nullable=True),
                    sa.Column('converted_dataset_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['job_id'], ['jobs.job_id']),
                    sa.ForeignKeyConstraint(['dataset_id'], ['datasets.id']),
                    sa.ForeignKeyConstraint(['converted_dataset_id'], ['datasets.id']),
                    sa.PrimaryKeyConstraint('job_id'))

    op.add_column('datasets', sa.Column('converted_from_id', sa.Integer(), nullable=True))
    op.add_column('datasets', sa.Column('is_internal', sa.Boolean(), nullable=False, server_default='false'))
    op.create_foreign_key('datasets_converted_from_fkey', 'datasets', 'datasets', ['converted_from_id'], ['id'])
    # Data migration - mark auto-annotated datasets from previous release as internal
    op.execute('UPDATE datasets SET is_internal=true WHERE is_auto_annotated=true')


def downgrade():
    raise NotImplementedError(f'Downgrade is not implemented for {revision}')
