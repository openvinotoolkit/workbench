"""add_accuracy_import

Revision ID: 1e1c4fc30e7c
Revises: 13c928632d8d
Create Date: 2021-02-09 09:46:54.677780

"""

"""
 OpenVINO DL Workbench
 Migration: Add raw accuracy configuration import

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
import sqlalchemy as sa
from alembic import op

from migrations.utils import SQLEnumMigrator

# revision identifiers, used by Alembic.
revision = '1e1c4fc30e7c'
down_revision = '13c928632d8d'
branch_labels = None
depends_on = None

old_task_enums = (
    'classification',
    'object_detection',
    'instance_segmentation',
    'semantic_segmentation',
    'inpainting',
    'style_transfer',
    'super_resolution',
    'face_recognition',
    'landmark_detection',
    'generic',
)

new_task_enums = (
    *old_task_enums,
    'custom'
)

old_task_method_enums = (
    'classificator',
    'generic',
    'ssd',
    'tiny_yolo_v2',
    'yolo_v2',
    'mask_rcnn',
    'segmentation',
    'inpainting',
    'style_transfer',
    'super_resolution',
    'face_recognition',
    'landmark_detection',
)

new_task_methods_enums = (
    *old_task_method_enums,
    'custom'
)

task_enum_migrator = SQLEnumMigrator(
    table_column_pairs=(
        ('dataset_tasks', 'task_type'), ('omz_topologies', 'task_type'), ('topologies_metadata', 'task_type')
    ),
    enum_name='taskenum',
    from_types=old_task_enums,
    to_types=new_task_enums
)
task_method_enum_migrator = SQLEnumMigrator(
    table_column_pairs=(('omz_topologies', 'topology_type'), ('topologies_metadata', 'topology_type')),
    enum_name='taskmethodenum',
    from_types=old_task_method_enums,
    to_types=new_task_methods_enums
)


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('project_accuracy',
                    sa.Column('creation_timestamp', sa.DateTime(), nullable=False),
                    sa.Column('last_modified', sa.DateTime(), nullable=True),
                    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
                    sa.Column('raw_configuration', sa.Text(), nullable=False),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.add_column('projects', sa.Column('project_accuracy_id', sa.Integer(), nullable=True))
    op.create_foreign_key('projects_project_accuracy_id_fkey', 'projects', 'project_accuracy', ['project_accuracy_id'],
                          ['id'])
    # ### end Alembic commands ###
    task_enum_migrator.upgrade()
    task_method_enum_migrator.upgrade()


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('projects_project_accuracy_id_fkey', 'projects', type_='foreignkey')
    op.drop_column('projects', 'project_accuracy_id')
    op.drop_table('project_accuracy')
    # ### end Alembic commands ###
    task_enum_migrator.downgrade()
    task_method_enum_migrator.downgrade()
