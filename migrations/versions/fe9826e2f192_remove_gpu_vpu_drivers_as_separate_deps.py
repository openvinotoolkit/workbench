"""Remove GPU and VPU drivers as separate deps

Revision ID: fe9826e2f192
Revises: 6954cddaa3ef
Create Date: 2021-10-01 16:17:05.075912

"""

"""
 OpenVINO DL Workbench
 Migration: Remove GPU and VPU drivers as separate deps

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
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fe9826e2f192'
down_revision = '6954cddaa3ef'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('deployment_bundle_configs', 'vpu_drivers')
    op.drop_column('deployment_bundle_configs', 'gpu_drivers')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('deployment_bundle_configs', sa.Column('gpu_drivers', sa.BOOLEAN(), autoincrement=False, nullable=True))
    op.add_column('deployment_bundle_configs', sa.Column('vpu_drivers', sa.BOOLEAN(), autoincrement=False, nullable=True))
    # ### end Alembic commands ###
