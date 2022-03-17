"""edge_node_script and wheels as a part of deployment package

Revision ID: 39bd11960375
Revises: 4e80f52facfa
Create Date: 2022-01-11 14:46:13.673732

"""

"""
 OpenVINO DL Workbench
 Migration: Use edge_node_setup script and wheels in deployment

 Copyright (c) 2022 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
