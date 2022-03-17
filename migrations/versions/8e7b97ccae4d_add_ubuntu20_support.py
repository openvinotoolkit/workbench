"""Add Ubuntu20 support

Revision ID: 8e7b97ccae4d
Revises: 521203454136
Create Date: 2021-03-31 14:57:09.088704

"""

"""
 OpenVINO DL Workbench
 Migration: Add Ubuntu20 support

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

from typing import List

import sqlalchemy as sa
from alembic import op
from sqlalchemy.ext.declarative import declarative_base

from migrations.utils import SQLEnumMigrator

revision = '8e7b97ccae4d'
down_revision = '521203454136'
branch_labels = None
depends_on = None

old_deployment_targets_types = (
    'cpu',
    'gpu',
    'myriad',
    'hddl',
    'opencv',
    'python36',
    'python37',
)

new_deployment_targets_types = (
    *old_deployment_targets_types,
    'python38',
)

os_enum = ('ubuntu18', 'ubuntu20', 'windows', 'mac')

Base = declarative_base()


class _JobExecutionDetailsModel(Base):
    __tablename__ = 'job_execution_details'

    job_id = sa.Column(sa.Integer, sa.ForeignKey('jobs.job_id'), primary_key=True)


class _JobsModel(Base):
    __tablename__ = 'jobs'

    job_id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    parent_job = sa.Column(sa.Integer, sa.ForeignKey(f'{__tablename__}.job_id'), nullable=True, default=None)


class _DeploymentManagerJobsModel(_JobsModel):
    __tablename__ = 'deployment_manager_jobs'

    job_id = sa.Column(sa.Integer, sa.ForeignKey('jobs.job_id'), primary_key=True)


DEPLOYMENT_TARGET_ENUM_MIGRATOR = SQLEnumMigrator(
    table_column_pairs=(('deployment_targets', 'target'),),
    enum_name='deploymenttargetenum',
    from_types=old_deployment_targets_types,
    to_types=new_deployment_targets_types)


def upgrade():
    bind = op.get_bind()
    session = sa.orm.Session(bind=bind)

    DEPLOYMENT_TARGET_ENUM_MIGRATOR.upgrade()

    targetosenum_type = sa.Enum(*os_enum, name='targetosenum')
    targetosenum_type.create(op.get_bind(), checkfirst=False)
    op.add_column('deployment_bundle_configs',
                  sa.Column('operating_system', targetosenum_type,
                            nullable=False, server_default=os_enum[0]))
    session.flush()
    deployment_manager_jobs = session.query(_DeploymentManagerJobsModel).all()
    for deployment_manager_job in deployment_manager_jobs:
        deployment_manager_job_id = deployment_manager_job.job_id

        next_jobs: List[_JobsModel] = session.query(_JobsModel).filter_by(parent_job=deployment_manager_job_id).all()

        for next_job in next_jobs:
            next_job.parent_job = deployment_manager_job.parent_job
            session.add(next_job)
            session.flush()

        job_execution_detail = session.query(_JobExecutionDetailsModel).get(deployment_manager_job_id)
        if job_execution_detail:
            session.delete(job_execution_detail)
            session.flush()

        base_job = session.query(_JobsModel).get(deployment_manager_job_id)

        session.delete(deployment_manager_job)
        session.flush()

        session.delete(base_job)
        session.flush()

    op.drop_table('deployment_manager_jobs')


def downgrade():
    raise NotImplementedError(f'Downgrade function is not implemented for {revision}')
