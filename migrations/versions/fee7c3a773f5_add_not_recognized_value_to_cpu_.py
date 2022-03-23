"""Add not recognized value to CPU platform type enum

Revision ID: fee7c3a773f5
Revises: 5aee5a3d96da
Create Date: 2020-11-19 14:12:40.039793

"""

"""
 OpenVINO DL Workbench
 Migration: Add not recognized value to CPU platform type enum

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
