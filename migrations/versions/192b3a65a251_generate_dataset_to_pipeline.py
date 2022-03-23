"""generate dataset to pipeline

Revision ID: 192b3a65a251
Revises: 260ffba4b041
Create Date: 2020-10-08 15:52:26.141457

"""

"""
 OpenVINO DL Workbench
 Migration: Generate dataset to pipeline

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


import datetime

import sqlalchemy as sa
from alembic import op
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Float, JSON, orm, Text
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.declarative import declarative_base

# revision identifiers, used by Alembic.
from migrations.utils.sql_enum_migrator import SQLEnumMigrator

revision = '192b3a65a251'
down_revision = '260ffba4b041'
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
)

new_pipeline_types = (
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
    'generate_dataset'
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
)

new_pipeline_stages = (
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
    'generate_dataset'
)

Base = declarative_base()

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

class _JobsModel(Base):
    __tablename__ = 'jobs'

    job_type = Column(String(50))

    __mapper_args__ = {
        'polymorphic_identity': 'job',
        'polymorphic_on': job_type
    }
    creation_timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    last_modified = Column(DateTime, onupdate=datetime.datetime.utcnow, default=datetime.datetime.utcnow)
    job_id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(String, nullable=True)

    project_id = Column(Integer, nullable=True)
    parent_job = Column(Integer, nullable=True, default=None)
    pipeline_id = Column(Integer, nullable=True, default=None)

    progress = Column(Float, nullable=False)

    status = sa.Column('status',
                       postgresql.ENUM('queued', 'running', 'ready', 'error', 'cancelled', 'archived', 'warning',
                                       name='statusenum'), autoincrement=False, nullable=False, default='queued')
    error_message = Column(String, nullable=True)


class _JobExecutionDetailsModel(Base):
    __tablename__ = 'job_execution_details'

    creation_timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    last_modified = Column(DateTime, onupdate=datetime.datetime.utcnow, default=datetime.datetime.utcnow)

    job_id = Column(Integer, ForeignKey('jobs.job_id'), primary_key=True)
    stage = Column('stage', postgresql.ENUM(*new_pipeline_stages), nullable=True)
    logs = Column(Text, nullable=True)
    progress = Column(Float, nullable=True)
    status = Column('status',
                    postgresql.ENUM('queued', 'running', 'ready', 'error', 'cancelled', 'archived', 'warning',
                                    name='statusenum'), autoincrement=False, nullable=False, default='queued')
    error_message = Column(String, nullable=True)
    warning_message = Column(String, nullable=True)


class _DatasetGenerationConfigsModel(Base):
    __tablename__ = 'dataset_generation_configs'

    __mapper_args__ = {
        'polymorphic_identity': 'DatasetGeneratorJob',
    }

    creation_timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    last_modified = Column(DateTime, onupdate=datetime.datetime.utcnow, default=datetime.datetime.utcnow)

    job_id = Column(Integer, ForeignKey('jobs.job_id'))
    result_dataset_id = Column(Integer, primary_key=True)
    number_images = Column(Integer, nullable=False)
    channels = Column(Integer, nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    dist_law = Column(String, nullable=False)
    dist_law_params = Column(JSON, nullable=False)
    status = Column('status',
                    postgresql.ENUM('queued', 'running', 'ready', 'error', 'cancelled', 'archived', 'warning',
                                    name='statusenum'), autoincrement=False, nullable=False, default='ready')
    error_message = Column(String, nullable=True)


class _PipelineModel(Base):
    __tablename__ = 'pipelines'

    creation_timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    last_modified = Column(DateTime, onupdate=datetime.datetime.utcnow, default=datetime.datetime.utcnow)
    id = Column(Integer, primary_key=True)
    target_id = Column(Integer, nullable=False)
    type = Column('type', postgresql.ENUM(*new_pipeline_types,
                                          name='pipelinetypeenum'), autoincrement=False, nullable=False)


class _LocalTargetModel(Base):
    __tablename__ = 'local_targets'

    id = Column(Integer, primary_key=True)


def upgrade():
    pipeline_type_enum_migrator.upgrade()
    pipeline_stage_enum_migrator.upgrade()

    bind = op.get_bind()
    session = orm.Session(bind=bind)

    op.add_column('dataset_generation_configs',
                  sa.Column('job_id', sa.INTEGER()))

    dataset_generation_configs = session.query(_DatasetGenerationConfigsModel).all()
    for config in dataset_generation_configs:
        # Create pipeline record for generation job
        pipeline = _PipelineModel()
        local_target = session.query(_LocalTargetModel).one()
        pipeline.target_id = local_target.id
        pipeline.creation_timestamp = config.creation_timestamp
        pipeline.last_modified = config.last_modified
        pipeline.type = 'generate_dataset'
        session.add(pipeline)
        session.flush()
        # Create job record for dataset generation
        job = _JobsModel()
        job.status = config.status
        job.error_message = config.error_message
        job.progress = 100
        job.type = 'DatasetGeneratorJob'
        job.creation_timestamp = config.creation_timestamp
        job.last_modified = config.last_modified
        job.pipeline_id = pipeline.id
        session.add(job)
        session.flush()
        # Connect Dataset generation job record with job record
        config.job_id = job.job_id
        # Create job details record
        job_details = _JobExecutionDetailsModel()
        job_details.job_id = job.job_id
        job_details.status = config.status
        job_details.error_message = config.error_message
        job_details.progress = 100
        job_details.stage = 'generate_dataset'
        job_details.creation_timestamp = config.creation_timestamp
        job_details.last_modified = config.last_modified
        session.add(job_details)
        session.add(config)

    session.flush()
    op.drop_column('dataset_generation_configs', 'status')
    op.drop_column('dataset_generation_configs', 'error_message')
    op.drop_column('dataset_generation_configs', 'creation_timestamp')
    op.drop_column('dataset_generation_configs', 'last_modified')
    op.rename_table('dataset_generation_configs', 'dataset_generation_job')
    # Drop primary key constraint.
    op.execute('ALTER TABLE dataset_generation_job DROP CONSTRAINT dataset_generation_configs_pkey CASCADE')
    # Drop dataset foreign key constraint.
    op.execute(
        'ALTER TABLE dataset_generation_job DROP CONSTRAINT dataset_generation_configs_result_dataset_id_fkey CASCADE')
    # Re-create the primary key constraint
    op.create_primary_key(None, 'dataset_generation_job', ['job_id'])
    # Re-create the foreign key constraint
    op.create_foreign_key(None, 'dataset_generation_job', 'jobs', ['job_id'], ['job_id'])
    # Re-create the foreign key constraint
    op.create_foreign_key(None, 'dataset_generation_job', 'datasets', ['result_dataset_id'], ['id'])


def downgrade():
    bind = op.get_bind()
    session = orm.Session(bind=bind)

    op.rename_table('dataset_generation_job', 'dataset_generation_configs')

    # Drop primary key constraint.
    op.execute('ALTER TABLE dataset_generation_configs DROP CONSTRAINT dataset_generation_job_pkey CASCADE')
    # Drop foreign key constraint.
    op.execute(
        'ALTER TABLE dataset_generation_configs DROP CONSTRAINT dataset_generation_job_result_dataset_id_fkey CASCADE')
    # Re-create the primary key constraint
    op.create_primary_key(None, 'dataset_generation_configs', ['result_dataset_id'])
    # Re-create the foreign key constraint
    op.create_foreign_key(None, 'dataset_generation_configs', 'datasets', ['result_dataset_id'], ['id'],
                          ondelete='CASCADE')
    # Drop foreign key on job
    op.execute('ALTER TABLE dataset_generation_configs DROP CONSTRAINT dataset_generation_job_job_id_fkey CASCADE')

    op.add_column('dataset_generation_configs',
                  Column('status',
                         postgresql.ENUM('queued', 'running', 'ready', 'error', 'cancelled', 'archived', 'warning',
                                         name='statusenum'), autoincrement=False, nullable=False,
                         server_default='queued'))

    op.add_column('dataset_generation_configs',
                  Column('error_message', String, nullable=True))

    op.add_column('dataset_generation_configs',
                  Column('creation_timestamp', DateTime, nullable=True))
    op.add_column('dataset_generation_configs',
                  Column('last_modified', DateTime))

    # Update
    op.execute("UPDATE jobs SET job_type=NULL WHERE job_type='DatasetGeneratorJob'")

    dataset_configs = session.query(_DatasetGenerationConfigsModel).all()
    for config in dataset_configs:
        job_exec_details = session.query(_JobExecutionDetailsModel).get(config.job_id)
        config.status = job_exec_details.status
        config.error_message = job_exec_details.error_message
        session.delete(job_exec_details)
        session.flush()
        job = session.query(_JobsModel).get(config.job_id)
        config.creation_timestamp = job.creation_timestamp
        config.last_modified = job.last_modified
        pipeline = session.query(_PipelineModel).get(job.pipeline_id)
        session.delete(job)
        session.flush()
        session.delete(pipeline)
        session.flush()
    op.drop_column('dataset_generation_configs', 'job_id')

    op.alter_column('dataset_generation_configs', 'creation_timestamp', nullable=False)
    op.alter_column('dataset_generation_configs', 'last_modified', nullable=False)

    pipeline_type_enum_migrator.downgrade()
    pipeline_stage_enum_migrator.downgrade()
