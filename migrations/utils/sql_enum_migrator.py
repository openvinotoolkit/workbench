"""
 OpenVINO DL Workbench
 Helping Class to migrate enums in database

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
from typing import Tuple, Set

import sqlalchemy.engine
from alembic import op
from sqlalchemy import Enum


class SQLEnumMigrator:
    from_enum: Enum
    new_enum: Enum
    to_enum: Enum

    enable_enum_check = False

    table_column_pairs: Tuple[Tuple[str, str]]

    def __init__(self,
                 # ((table_name, column_name))
                 table_column_pairs: Tuple[Tuple[str, str], ...],
                 enum_name: str,
                 from_types: Tuple[str, ...],
                 to_types: Tuple[str, ...]):
        self.table_column_pairs = table_column_pairs
        self.from_enum = Enum(*from_types, name=enum_name)
        self.to_enum = Enum(*{*to_types, *from_types}, name=f'tmp_{enum_name}')
        self.new_enum = Enum(*to_types, name=enum_name)

    def upgrade(self):
        self._migrate(self.from_enum, self.to_enum, self.new_enum)

    def downgrade(self):
        self._migrate(self.new_enum, self.to_enum, self.from_enum)

    def _migrate(self, from_enum: Enum, tmp_enum: Enum, to_enum: Enum):
        if self.enable_enum_check:
            self._check_enum_values(op.get_bind())

        # create a temporary "tmp_..." type
        tmp_enum.create(op.get_bind(), checkfirst=False)

        # assign columns to a tmp type
        for [table_name, column_name] in self.table_column_pairs:
            op.execute(f'ALTER TABLE {table_name} ALTER COLUMN {column_name} TYPE {tmp_enum.name}'
                       f' USING {column_name}::text::{tmp_enum.name}')

        # drop old enum
        from_enum.drop(op.get_bind(), checkfirst=False)

        # Create new enum
        to_enum.create(op.get_bind(), checkfirst=False)

        # assign columns to a new enum
        for [table_name, column_name] in self.table_column_pairs:
            op.execute(f'ALTER TABLE {table_name} ALTER COLUMN {column_name} TYPE {to_enum.name}'
                       f' USING {column_name}::text::{to_enum.name}')

        # drop tmp enum
        tmp_enum.drop(op.get_bind(), checkfirst=False)

    @staticmethod
    def _get_enum_values(enum_name: str, connection: sqlalchemy.engine.Connection) -> Set[str]:
        enum_values = next(iter(connection.execute(f'SELECT enum_range(NULL::{enum_name})')))
        enum_values = enum_values[0].strip('{}').split(',')
        return set(enum_values)

    def _check_enum_values(self, connection: sqlalchemy.engine.Connection) -> None:
        db_enum_values = self._get_enum_values(self.from_enum.name, connection)
        migration_enum_values = set(self.from_enum.enums)

        missing_db_enum_values = db_enum_values - migration_enum_values
        if missing_db_enum_values:
            raise ValueError(
                f'Old enum tuple for {self.from_enum.name} has missing values: {missing_db_enum_values}. '
                f'Please add them to the migration.'
            )

        excess_migration_enum_values = migration_enum_values - db_enum_values
        if excess_migration_enum_values:
            raise ValueError(
                f'Old enum tuple for {self.from_enum.name} has excess values: {excess_migration_enum_values}. '
                f'Please remove them from the migration.'
            )
