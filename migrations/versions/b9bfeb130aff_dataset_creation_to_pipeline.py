"""dataset creation to pipeline

Revision ID: b9bfeb130aff
Revises: a511acc6ec24
Create Date: 2020-10-28 11:31:53.183511

"""

"""
 OpenVINO DL Workbench
 Migration: Dataset creation to pipeline

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
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Float, orm, Text
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.declarative import declarative_base

# revision identifiers, used by Alembic.
from migrations.utils.sql_enum_migrator import SQLEnumMigrator

revision = 'b9bfeb130aff'
down_revision = 'a511acc6ec24'
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
    'generate_dataset'
)

new_pipeline_types = (
    *old_pipeline_types,
    'upload_dataset'
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
    'generate_dataset'
)

new_pipeline_stages = (
    *old_pipeline_stages,
    'wait_dataset_upload',
    'extract_dataset',
    'recognize_dataset',
    'validate_dataset'
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

Base = declarative_base()


class _Artifact(Base):
    __tablename__ = 'artifacts'

    type = Column(String(30))

    __mapper_args__ = {
        'polymorphic_identity': __tablename__,
        'polymorphic_on': type
    }

    creation_timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    last_modified = Column(DateTime, onupdate=datetime.datetime.utcnow, default=datetime.datetime.utcnow)

    id = Column(Integer, primary_key=True, autoincrement=True)

    name = Column(String, nullable=False, default='artifact')
    path = Column(String, nullable=True)
    size = Column(Float, nullable=True, default=0.0)
    checksum = Column(String, nullable=True)

    progress = Column(Float, nullable=False, default=0)
    status = sa.Column('status',
                       postgresql.ENUM('queued', 'running', 'ready', 'error', 'cancelled', 'archived', 'warning',
                                       name='statusenum'), autoincrement=False, nullable=False, default='queued')
    error_message = Column(String, nullable=True)

    task_id = Column(String, nullable=True)


class _DatasetsModel(_Artifact):
    __tablename__ = 'datasets'

    __mapper_args__ = {
        'polymorphic_identity': __tablename__
    }

    id = Column(Integer, ForeignKey('artifacts.id'), primary_key=True)
    dataset_type = Column(postgresql.ENUM('imagenet', 'voc', 'coco', 'common_semantic_segmentation', 'not_annotated',
                                          name='datasettypesenum'), nullable=True)
    number_images = Column(Integer, default=0, nullable=False)
    labels_number = Column(Integer, nullable=True)
    max_label_id = Column(Integer, nullable=True)


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


class _WaitDatasetUploadJobsModel(_JobsModel):
    __tablename__ = 'wait_dataset_upload_jobs'

    __mapper_args__ = {
        'polymorphic_identity': 'WaitDatasetUploadJob'
    }

    job_id = Column(Integer, ForeignKey('jobs.job_id'), primary_key=True)
    dataset_id = Column(Integer, nullable=False)


class _DatasetRecognizerJobsModel(_JobsModel):
    __tablename__ = 'recognize_dataset_jobs'

    __mapper_args__ = {
        'polymorphic_identity': 'RecognizeDatasetJob'
    }

    job_id = Column(Integer, ForeignKey('jobs.job_id'), primary_key=True)
    dataset_id = Column(Integer, nullable=False)


class _DatasetValidatorJobsModel(_JobsModel):
    __tablename__ = 'validate_dataset_jobs'

    __mapper_args__ = {
        'polymorphic_identity': 'ValidateDatasetJob'
    }

    job_id = Column(Integer, ForeignKey('jobs.job_id'), primary_key=True)
    dataset_id = Column(Integer, nullable=False)


class _DatasetExtractorJobsModel(_JobsModel):
    __tablename__ = 'extract_dataset_jobs'

    __mapper_args__ = {
        'polymorphic_identity': 'ExtractDatasetJob'
    }

    job_id = Column(Integer, ForeignKey('jobs.job_id'), primary_key=True)
    dataset_id = Column(Integer, nullable=False)


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('wait_dataset_upload_jobs',
                    sa.Column('job_id', sa.Integer(), nullable=False),
                    sa.Column('dataset_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['dataset_id'], ['datasets.id'], ),
                    sa.ForeignKeyConstraint(['job_id'], ['jobs.job_id'], ),
                    sa.PrimaryKeyConstraint('job_id')
                    )
    op.create_table('extract_dataset_jobs',
                    sa.Column('job_id', sa.Integer(), nullable=False),
                    sa.Column('dataset_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['dataset_id'], ['datasets.id'], ),
                    sa.ForeignKeyConstraint(['job_id'], ['jobs.job_id'], ),
                    sa.PrimaryKeyConstraint('job_id')
                    )
    op.create_table('recognize_dataset_jobs',
                    sa.Column('job_id', sa.Integer(), nullable=False),
                    sa.Column('dataset_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['dataset_id'], ['datasets.id'], ),
                    sa.ForeignKeyConstraint(['job_id'], ['jobs.job_id'], ),
                    sa.PrimaryKeyConstraint('job_id')
                    )
    op.create_table('validate_dataset_jobs',
                    sa.Column('job_id', sa.Integer(), nullable=False),
                    sa.Column('dataset_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['dataset_id'], ['datasets.id'], ),
                    sa.ForeignKeyConstraint(['job_id'], ['jobs.job_id'], ),
                    sa.PrimaryKeyConstraint('job_id')
                    )
    # ### end Alembic commands ###
    pipeline_type_enum_migrator.upgrade()
    pipeline_stage_enum_migrator.upgrade()

    bind = op.get_bind()
    session = orm.Session(bind=bind)

    datasets = session.query(_DatasetsModel).all()
    for dataset in datasets:
        # Create pipeline record for dataset creation job
        pipeline = _PipelineModel()
        local_target = session.query(_LocalTargetModel).one()
        pipeline.target_id = local_target.id
        pipeline.creation_timestamp = dataset.creation_timestamp
        pipeline.last_modified = dataset.last_modified
        pipeline.type = 'upload_dataset'
        session.add(pipeline)
        session.flush()
        # Create wait dataset upload job record
        wait_upload_job = _WaitDatasetUploadJobsModel()
        wait_upload_job.dataset_id = dataset.id
        wait_upload_job.status = dataset.status
        wait_upload_job.error_message = dataset.error_message
        wait_upload_job.progress = 100
        wait_upload_job.job_type = 'WaitDatasetUploadJob'
        wait_upload_job.creation_timestamp = dataset.creation_timestamp
        wait_upload_job.last_modified = dataset.last_modified
        wait_upload_job.pipeline_id = pipeline.id
        session.add(wait_upload_job)
        session.flush()
        # Create job details record for dataset upload job
        wait_upload_job_details = _JobExecutionDetailsModel()
        wait_upload_job_details.job_id = wait_upload_job.job_id
        wait_upload_job_details.status = dataset.status
        wait_upload_job_details.error_message = dataset.error_message
        wait_upload_job_details.progress = 100
        wait_upload_job_details.stage = 'wait_dataset_upload'
        wait_upload_job_details.creation_timestamp = dataset.creation_timestamp
        wait_upload_job_details.last_modified = dataset.last_modified
        session.add(wait_upload_job_details)
        session.flush()
        # Create dataset extractor job record
        extractor_job = _DatasetExtractorJobsModel()
        extractor_job.dataset_id = dataset.id
        extractor_job.status = dataset.status
        extractor_job.error_message = dataset.error_message
        extractor_job.progress = 100
        extractor_job.job_type = 'DatasetExtractorJob'
        extractor_job.creation_timestamp = dataset.creation_timestamp
        extractor_job.last_modified = dataset.last_modified
        extractor_job.pipeline_id = pipeline.id
        session.add(extractor_job)
        session.flush()
        # Create job details record for dataset extractor job
        extractor_job_details = _JobExecutionDetailsModel()
        extractor_job_details.job_id = extractor_job.job_id
        extractor_job_details.status = dataset.status
        extractor_job_details.error_message = dataset.error_message
        extractor_job_details.progress = 100
        extractor_job_details.stage = 'extract_dataset'
        extractor_job_details.creation_timestamp = dataset.creation_timestamp
        extractor_job_details.last_modified = dataset.last_modified
        session.add(extractor_job_details)
        session.flush()
        # Create dataset recognizer job record
        recognizer_job = _DatasetRecognizerJobsModel()
        recognizer_job.dataset_id = dataset.id
        recognizer_job.status = dataset.status
        recognizer_job.error_message = dataset.error_message
        recognizer_job.progress = 100
        recognizer_job.job_type = 'DatasetRecognizerJob'
        recognizer_job.creation_timestamp = dataset.creation_timestamp
        recognizer_job.last_modified = dataset.last_modified
        recognizer_job.pipeline_id = pipeline.id
        session.add(recognizer_job)
        session.flush()
        # Create job details record for dataset recognizer job
        recognizer_job_details = _JobExecutionDetailsModel()
        recognizer_job_details.job_id = recognizer_job.job_id
        recognizer_job_details.status = dataset.status
        recognizer_job_details.error_message = dataset.error_message
        recognizer_job_details.progress = 100
        recognizer_job_details.stage = 'recognize_dataset'
        recognizer_job_details.creation_timestamp = dataset.creation_timestamp
        recognizer_job_details.last_modified = dataset.last_modified
        session.add(recognizer_job_details)
        session.flush()
        # Create dataset validator job record
        validator_job = _DatasetValidatorJobsModel()
        validator_job.dataset_id = dataset.id
        validator_job.status = dataset.status
        validator_job.error_message = dataset.error_message
        validator_job.progress = 100
        validator_job.job_type = 'DatasetValidatorJob'
        validator_job.creation_timestamp = dataset.creation_timestamp
        validator_job.last_modified = dataset.last_modified
        validator_job.pipeline_id = pipeline.id
        session.add(validator_job)
        session.flush()
        # Create job details record for dataset validator job
        validator_job_details = _JobExecutionDetailsModel()
        validator_job_details.job_id = validator_job.job_id
        validator_job_details.status = dataset.status
        validator_job_details.error_message = dataset.error_message
        validator_job_details.progress = 100
        validator_job_details.stage = 'validate_dataset'
        validator_job_details.creation_timestamp = dataset.creation_timestamp
        validator_job_details.last_modified = dataset.last_modified
        session.add(validator_job_details)
        session.flush()


def downgrade():
    bind = op.get_bind()
    session = orm.Session(bind=bind)

    extract_dataset_jobs = session.query(_DatasetExtractorJobsModel).all()
    validate_dataset_jobs = session.query(_DatasetValidatorJobsModel).all()
    recognize_dataset_jobs = session.query(_DatasetRecognizerJobsModel).all()
    pipeline_to_delete_ids = []
    for job in (*extract_dataset_jobs, *validate_dataset_jobs, *recognize_dataset_jobs):
        exec_details_record = session.query(_JobExecutionDetailsModel).get(job.job_id)
        session.delete(exec_details_record)
        session.flush()
        if job.pipeline_id not in pipeline_to_delete_ids:
            pipeline_to_delete_ids.append(job.pipeline_id)
        session.delete(job)
        session.flush()

    for pipeline_id in pipeline_to_delete_ids:
        pipeline = session.query(_PipelineModel).get(pipeline_id)
        session.delete(pipeline)
        session.flush()

    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('wait_dataset_upload_jobs')
    op.drop_table('validate_dataset_jobs')
    op.drop_table('recognize_dataset_jobs')
    op.drop_table('extract_dataset_jobs')
    # ### end Alembic commands ###

    pipeline_type_enum_migrator.downgrade()
    pipeline_stage_enum_migrator.downgrade()
