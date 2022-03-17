"""Add runtime precision transition info

Revision ID: daba69779917
Revises: dcdcf03fbfd7
Create Date: 2021-01-15 18:01:54.536411

"""

"""
 OpenVINO DL Workbench
 Migration: Add runtime precision transition info

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
