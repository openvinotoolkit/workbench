"""Enable Pentium base platform

Revision ID: 5be51e1d42ff
Revises: d57314d3dc73
Create Date: 2022-02-28 17:39:27.957413

"""

"""
 OpenVINO DL Workbench
 Migration: Enable Pentium base platform

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
from migrations.utils import SQLEnumMigrator


# revision identifiers, used by Alembic.
revision = '5be51e1d42ff'
down_revision = 'd57314d3dc73'
branch_labels = None
depends_on = None


old_cpu_platform_types = (
    'celeron',
    'atom',
    'core',
    'xeon',
    'not_recognized'
)

new_cpu_platform_types = (*old_cpu_platform_types, 'pentium')

cpu_platform_type_enum_migrator = SQLEnumMigrator(
    table_column_pairs=(('cpu_info', 'platform_type'),),
    enum_name='cpuplatformtypeenum',
    from_types=old_cpu_platform_types,
    to_types=new_cpu_platform_types
)


def upgrade():
    cpu_platform_type_enum_migrator.upgrade()


def downgrade():
    raise NotImplementedError(f'Downgrade is not implemented for the {revision} migration')
