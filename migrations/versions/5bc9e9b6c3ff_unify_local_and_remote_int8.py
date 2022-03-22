"""Unify local and remote int8

Revision ID: 5bc9e9b6c3ff
Revises: 7f3c818591e1
Create Date: 2021-03-29 15:28:58.945918

"""

"""
 OpenVINO DL Workbench
 Migration: Unify local and remote int8

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
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5bc9e9b6c3ff'
down_revision = '7f3c818591e1'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('create_int8_calibration_scripts_jobs',
    sa.Column('job_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['job_id'], ['jobs.job_id'], ),
    sa.PrimaryKeyConstraint('job_id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('create_int8_calibration_scripts_jobs')
    # ### end Alembic commands ###
