"""Add not recognized value to CPU platform type enum

Revision ID: fee7c3a773f5
Revises: 5aee5a3d96da
Create Date: 2020-11-19 14:12:40.039793

"""

"""
 OpenVINO DL Workbench
 Migration: Add not recognized value to CPU platform type enum

 Copyright (c) 2020 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
from typing import Tuple

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
from migrations.utils.sql_enum_migrator import SQLEnumMigrator

revision = 'fee7c3a773f5'
down_revision = '5aee5a3d96da'
branch_labels = None
depends_on = None

old_cpu_platform_types = (
    'celeron',
    'atom',
    'core',
    'xeon',
)

new_cpu_platform_types = (
    *old_cpu_platform_types,
    'not_recognized'
)

cpu_platform_type_enum_migrator = SQLEnumMigrator(
    (('cpu_info', 'platform_type'),),
    'cpuplatformtypeenum',
    old_cpu_platform_types,
    new_cpu_platform_types
)


def upgrade():
    cpu_platform_type_enum_migrator.upgrade()


def downgrade():
    cpu_platform_type_enum_migrator.downgrade()
