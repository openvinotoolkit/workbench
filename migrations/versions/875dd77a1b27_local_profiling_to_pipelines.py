"""Local Profiling to pipelines

Revision ID: 875dd77a1b27
Revises: 08533cf8eaa4
Create Date: 2020-12-12 14:50:26.357253

"""

"""
 OpenVINO DL Workbench
 Migration: Local Profiling to pipelines

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

from alembic import op
from sqlalchemy import Column, DateTime, Integer, orm, String, Float, ForeignKey, Text
import datetime
from sqlalchemy.dialects import postgresql

from migrations.utils import JobTypeMigrator
from sqlalchemy.ext.declarative import declarative_base

# revision identifiers, used by Alembic.
revision = '875dd77a1b27'
down_revision = '08533cf8eaa4'
branch_labels = None
depends_on = None

job_type_migrator = JobTypeMigrator(old_job_type='CompoundInferenceJob', new_job_type='ProfilingJob')

Base = declarative_base()


class _JobExecutionDetailsModel(Base):
    __tablename__ = 'job_execution_details'

    creation_timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    last_modified = Column(DateTime, onupdate=datetime.datetime.utcnow, default=datetime.datetime.utcnow)

    job_id = Column(Integer, ForeignKey('jobs.job_id'), primary_key=True)
    stage = Column('stage', postgresql.ENUM('profiling'), nullable=True)
    logs = Column(Text, nullable=True)
    progress = Column(Float, nullable=True)
    status = Column('status',
                    postgresql.ENUM('queued', 'running', 'ready', 'error', 'cancelled', 'archived', 'warning',
                                    name='statusenum'), autoincrement=False, nullable=False, default='queued')
    error_message = Column(String, nullable=True)
    warning_message = Column(String, nullable=True)


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

    status = Column('status',
                    postgresql.ENUM('queued', 'running', 'ready', 'error', 'cancelled', 'archived', 'warning',
                                    name='statusenum'), autoincrement=False, nullable=False, default='queued')
    error_message = Column(String, nullable=True)


class _ProfilingJobModel(_JobsModel):
    __tablename__ = 'profiling_jobs'

    __mapper_args__ = {
        'polymorphic_identity': 'ProfilingJob'
    }

    job_id = Column(Integer, ForeignKey('jobs.job_id'), primary_key=True)

    inference_time = Column(Integer, nullable=False)
    num_single_inferences = Column(Integer, nullable=False)

    started_timestamp = Column(DateTime, nullable=True)


class _PipelineModel(Base):
    __tablename__ = 'pipelines'

    creation_timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    last_modified = Column(DateTime, onupdate=datetime.datetime.utcnow, default=datetime.datetime.utcnow)
    id = Column(Integer, primary_key=True)
    target_id = Column(Integer, nullable=False)
    type = Column('type', postgresql.ENUM('local_profiling', 'local_int8_calibration',
                                          name='pipelinetypeenum'), autoincrement=False, nullable=False)


def upgrade():
    op.rename_table('compound_inferences_jobs', 'profiling_jobs')
    op.rename_table('single_inference_jobs', 'single_inference_info')
    op.alter_column('single_inference_info', column_name='compound_job_id', new_column_name='profiling_job_id')
    bind = op.get_bind()
    session = orm.Session(bind=bind)
    job_type_migrator.upgrade(session)

    profiling_jobs = session.query(_ProfilingJobModel).filter_by(pipeline_id=None).all()
    for profiling_job in profiling_jobs:
        # Create pipeline record for profiling job
        pipeline = _PipelineModel()
        local_target = session.query(_LocalTargetModel).one()
        pipeline.target_id = local_target.id
        pipeline.creation_timestamp = profiling_job.creation_timestamp
        pipeline.last_modified = profiling_job.last_modified
        pipeline.type = 'local_profiling'
        session.add(pipeline)
        session.flush()
        # assign local profiling pipeline to the job
        profiling_job.pipeline_id = pipeline.id
        session.add(profiling_job)
        session.flush()
        # Create job details record for profiling job
        profiling_job_details = _JobExecutionDetailsModel()
        profiling_job_details.job_id = profiling_job.job_id
        profiling_job_details.status = profiling_job.status
        profiling_job_details.error_message = profiling_job.error_message
        profiling_job_details.progress = 100
        profiling_job_details.stage = 'profiling'
        profiling_job_details.creation_timestamp = profiling_job.creation_timestamp
        profiling_job_details.last_modified = profiling_job.last_modified
        session.add(profiling_job_details)
        session.flush()
    # Profiling jobs after INT8 calibrations do not have execution details records
    pipelines_for_int8_calibrations = session.query(_PipelineModel).filter_by(type='local_int8_calibration').all()
    for pipeline in pipelines_for_int8_calibrations:
        int8_profiling_jobs = session.query(_ProfilingJobModel).filter_by(pipeline_id=pipeline.id).all()
        for int8_profiling_job in int8_profiling_jobs:
            # Update job details record for int8 profiling job
            profiling_job_details = session.query(_JobExecutionDetailsModel).filter_by(stage=None).first()
            profiling_job_details.status = int8_profiling_job.status
            profiling_job_details.error_message = int8_profiling_job.error_message
            profiling_job_details.progress = 100
            profiling_job_details.stage = 'profiling'
            profiling_job_details.creation_timestamp = int8_profiling_job.creation_timestamp
            profiling_job_details.last_modified = int8_profiling_job.last_modified
            session.add(profiling_job_details)
            session.flush()


def downgrade():
    raise NotImplementedError('downgrade is not supported')
