"""Add runtime precision transition info

Revision ID: daba69779917
Revises: dcdcf03fbfd7
Create Date: 2021-01-15 18:01:54.536411

"""

"""
 OpenVINO DL Workbench
 Migration: Add runtime precision transition info

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
revision = 'daba69779917'
down_revision = 'dcdcf03fbfd7'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('single_inference_info', sa.Column('precision_distribution', sa.Text(), nullable=True))
    op.add_column('single_inference_info', sa.Column('precision_transitions', sa.Text(), nullable=True))
    op.add_column('single_inference_info',
                  sa.Column('runtime_precisions_available', sa.Boolean(), nullable=False, server_default='false'))
    op.alter_column('single_inference_info', 'runtime_precisions_available', server_default=None)


def downgrade():
    raise NotImplementedError('downgrade is not supported')
