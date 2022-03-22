"""edge_node_script and wheels as a part of deployment package

Revision ID: 39bd11960375
Revises: 4e80f52facfa
Create Date: 2022-01-11 14:46:13.673732

"""

"""
 OpenVINO DL Workbench
 Migration: Use edge_node_setup script and wheels in deployment

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
revision = '39bd11960375'
down_revision = '4e80f52facfa'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('deployment_bundle_configs', sa.Column('edge_node_setup_script', sa.Boolean(), nullable=True))
    op.drop_column('deployment_bundle_configs', 'benchmark')
    op.drop_column('deployment_bundle_configs', 'pot')


def downgrade():
    raise NotImplementedError(f'Downgrade is not supported for {revision}.')
