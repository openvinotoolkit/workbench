"""deprecate_ir_v10

Revision ID: 17cec5304757
Revises: 39bd11960375
Create Date: 2022-01-12 17:42:08.474245

"""

"""
 OpenVINO DL Workbench
 Migration: Deprecate IR v10

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


# revision identifiers, used by Alembic.
revision = '17cec5304757'
down_revision = '39bd11960375'
branch_labels = None
depends_on = None


def upgrade():
    # Mark all models with IR version lower than 10 as archived
    op.execute("UPDATE artifacts SET status='archived' FROM topology_analysis_jobs j WHERE j.model_id = id AND j.ir_version::integer <= 10;")


def downgrade():
    raise NotImplementedError(f'Downgrade is not implemented for the {revision} migration')
