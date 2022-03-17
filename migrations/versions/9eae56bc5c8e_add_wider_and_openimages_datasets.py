"""add wider and openimages datasets

Revision ID: 9eae56bc5c8e
Revises: f4dce89a71bf
Create Date: 2021-07-26 00:59:00.078433

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
