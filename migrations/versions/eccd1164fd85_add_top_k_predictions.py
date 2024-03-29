"""add_top_k_predictions

Revision ID: eccd1164fd85
Revises: 2a070ca81f20
Create Date: 2021-08-16 12:09:34.959868

"""

"""
 OpenVINO DL Workbench
 Migration: Add top k predictions to classification report entities

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


# revision identifiers, used by Alembic.
revision = 'eccd1164fd85'
down_revision = '2a070ca81f20'
branch_labels = None
depends_on = None


def upgrade():
    op.execute('DELETE FROM accuracy_classification_report_image_classes WHERE id > 0;')
    op.execute('DELETE FROM accuracy_detection_report_image_classes WHERE id > 0;')
    op.execute('DELETE FROM accuracy_tensor_distance_report_image_classes WHERE id > 0;')
    op.execute('DELETE FROM accuracy_tensor_distance_report WHERE id > 0;')
    op.execute('DELETE FROM accuracy_report WHERE id > 0;')

    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('accuracy_classification_report_image_classes', sa.Column('top_k_predictions', sa.Text(), nullable=False))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('accuracy_classification_report_image_classes', 'top_k_predictions')
    # ### end Alembic commands ###
