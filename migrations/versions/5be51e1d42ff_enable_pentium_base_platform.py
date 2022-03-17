"""Enable Pentium base platform

Revision ID: 5be51e1d42ff
Revises: d57314d3dc73
Create Date: 2022-02-28 17:39:27.957413

"""

"""
 OpenVINO DL Workbench
 Migration: Enable Pentium base platform

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
