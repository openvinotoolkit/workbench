"""add wider and openimages datasets

Revision ID: 9eae56bc5c8e
Revises: f4dce89a71bf
Create Date: 2021-07-26 00:59:00.078433

"""

"""
 OpenVINO DL Workbench
 Migration: Generate dataset to pipeline

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
import sqlalchemy as sa

from migrations.utils.sql_enum_migrator import SQLEnumMigrator


# revision identifiers, used by Alembic.
revision = '9eae56bc5c8e'
down_revision = 'f4dce89a71bf'
branch_labels = None
depends_on = None


old_dataset_types = (
    'imagenet',
    'voc',
    'coco',
    'common_semantic_segmentation',
    'common_super_resolution',
    'lfw',
    'vggface2',
    'not_annotated',
)

new_dataset_types = (
    *old_dataset_types,
    'wider_face',
    'open_images',
)

dataset_type_migrator = SQLEnumMigrator(
    (('datasets', 'dataset_type'),),
    'datasettypesenum',
    old_dataset_types,
    new_dataset_types
)


def upgrade():
    dataset_type_migrator.upgrade()


def downgrade():
    raise NotImplementedError('downgrade is not supported')
