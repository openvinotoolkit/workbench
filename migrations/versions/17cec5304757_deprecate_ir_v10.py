"""deprecate_ir_v10

Revision ID: 17cec5304757
Revises: 39bd11960375
Create Date: 2022-01-12 17:42:08.474245

"""

"""
 OpenVINO DL Workbench
 Migration: Deprecate IR v10

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
