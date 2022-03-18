"""Winograd to pipelines

Revision ID: 08533cf8eaa4
Revises: fee7c3a773f5
Create Date: 2020-12-07 14:08:01.330219

"""

"""
 OpenVINO DL Workbench
 Migration: Winograd to pipelines

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
from alembic import op
from sqlalchemy import Column, Integer
from sqlalchemy.orm import Session
from sqlalchemy.dialects import postgresql

from migrations.utils import SQLEnumMigrator, JobTypeMigrator
from sqlalchemy.ext.declarative import declarative_base

# revision identifiers, used by Alembic.

revision = '08533cf8eaa4'
down_revision = 'fee7c3a773f5'
branch_labels = None
depends_on = None

old_pipeline_types = (
    'accuracy',
    'remote_profiling',
    'local_profiling',
    'dev_cloud_profiling',
    'local_int8_calibration',
    'remote_int8_calibration',
    'create_profiling_bundle',
    'create_int8_calibration_bundle',
    'download_log',
    'export_project_report',
    'export_inference_report',
    'download_model',
    'deployment_manager',
    'setup',
    'ping',
    'dev_cloud_int8_calibration',
    'inference_test_image',
    'generate_dataset',
    'upload_dataset'
)

new_pipeline_types = (
    *old_pipeline_types,
    'local_winograd_tuning'
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
    'profiling',
    'getting_remote_job_result',
    'download_log',
    'export_project_report',
    'export_inference_report',
    'int8_calibration',
    'remote_int8_calibration',
    'model_analyzer',
    'inference_test_image',
    'generate_dataset',
    'wait_dataset_upload',
    'extract_dataset',
    'recognize_dataset',
    'validate_dataset'
)

new_pipeline_stages = (
    *old_pipeline_stages,
    'winograd_tuning'
)

old_optimization_types = (
    'inference', 'int8calibration', 'winograd_autotune'
)

tmp_optimization_types = (
    *old_optimization_types, 'winograd_tune'
)

new_optimization_types = (
    'inference', 'int8calibration', 'winograd_tune'
)

pipeline_type_enum_migrator = SQLEnumMigrator(
    table_column_pairs=(('pipelines', 'type'),),
    enum_name='pipelinetypeenum',
    from_types=old_pipeline_types,
    to_types=new_pipeline_types
)

pipeline_stage_enum_migrator = SQLEnumMigrator(
    table_column_pairs=(('job_execution_details', 'stage'),),
    enum_name='pipelinestageenum',
    from_types=old_pipeline_stages,
    to_types=new_pipeline_stages
)

optimization_types_enum_migrator_tmp = SQLEnumMigrator(
    table_column_pairs=(('projects', 'optimization_type'),),
    enum_name='optimizationtypesenum',
    from_types=old_optimization_types,
    to_types=tmp_optimization_types
)

optimization_types_enum_migrator = SQLEnumMigrator(
    table_column_pairs=(('projects', 'optimization_type'),),
    enum_name='optimizationtypesenum',
    from_types=tmp_optimization_types,
    to_types=new_optimization_types
)

job_type_migrator = JobTypeMigrator(old_job_type='WinogradAutotuneJob', new_job_type='WinogradTuneJob')

Base = declarative_base()


class _ProjectsModel(Base):
    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True, autoincrement=True)

    optimization_type = Column('optimization_type',
                               postgresql.ENUM(*tmp_optimization_types, name='optimizationtypesenum'),
                               nullable=False)


def upgrade():
    op.rename_table('winograd_autotune_jobs', 'winograd_tune_jobs')

    pipeline_type_enum_migrator.upgrade()
    pipeline_stage_enum_migrator.upgrade()
    optimization_types_enum_migrator_tmp.upgrade()

    bind = op.get_bind()
    session = Session(bind=bind)

    winograd_projects = session.query(_ProjectsModel).filter_by(optimization_type='winograd_autotune').all()
    for project in winograd_projects:
        project.optimization_type = 'winograd_tune'
        session.add(project)
        session.flush()

    optimization_types_enum_migrator.upgrade()
    job_type_migrator.upgrade(session)


def downgrade():
    raise NotImplementedError('downgrade is not supported')
