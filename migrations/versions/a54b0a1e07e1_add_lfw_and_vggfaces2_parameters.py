"""add lfw and vggfaces2 parameters

Revision ID: a54b0a1e07e1
Revises: daba69779917
Create Date: 2021-01-18 19:47:12.297166

"""

"""
 OpenVINO DL Workbench
 Migration: Generate dataset to pipeline

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

from migrations.utils.sql_enum_migrator import SQLEnumMigrator


# revision identifiers, used by Alembic.
revision = 'a54b0a1e07e1'
down_revision = 'daba69779917'
branch_labels = None
depends_on = None


old_task_types = (
    'classification',
    'object_detection',
    'instance_segmentation',
    'semantic_segmentation',
    'inpainting',
    'style_transfer',
    'super_resolution',
    'generic'
)

new_task_types = (
    *old_task_types,
    'face_recognition',
    'landmark_detection',
)

old_task_methods = (
    'classificator',
    'generic',
    'ssd',
    'tiny_yolo_v2',
    'yolo_v2',
    'mask_rcnn',
    'segmentation',
    'inpainting',
    'style_transfer',
    'super_resolution'
)

new_task_methods = (
    *old_task_methods,
    'face_recognition',
    'landmark_detection',
)

old_dataset_types = (
    'imagenet',
    'voc',
    'coco',
    'common_semantic_segmentation',
    'common_super_resolution',
    'not_annotated',
)

new_dataset_types = (
    *old_dataset_types,
    'lfw',
    'vggface2',
)


task_type_migrator = SQLEnumMigrator(
    (('topologies_metadata', 'task_type'), ('omz_topologies', 'task_type'), ('dataset_tasks', 'task_type')),
    'taskenum',
    old_task_types,
    new_task_types
)

task_method_migrator = SQLEnumMigrator(
    (('omz_topologies', 'topology_type'), ('topologies_metadata', 'topology_type')),
    'taskmethodenum',
    old_task_methods,
    new_task_methods
)

dataset_type_migrator = SQLEnumMigrator(
    (('datasets', 'dataset_type'),),
    'datasettypesenum',
    old_dataset_types,
    new_dataset_types
)


def upgrade():
    task_type_migrator.upgrade()
    task_method_migrator.upgrade()
    dataset_type_migrator.upgrade()


def downgrade():
    raise NotImplementedError('downgrade is not supported')
