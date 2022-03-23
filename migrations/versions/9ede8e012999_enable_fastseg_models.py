"""Enable fastseg models to appear in the OMZ table

Revision ID: 9ede8e012999
Revises: c2f12b313b48
Create Date: 2022-02-11 15:23:34.127963

"""

"""
 OpenVINO DL Workbench
 Migration: Enable fastseg models to appear in the OMZ table

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

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9ede8e012999'
down_revision = 'c2f12b313b48'
branch_labels = None
depends_on = None


def upgrade():

    op.execute(
        'UPDATE omz_topologies SET advanced_configuration = \'{"preprocessing": [{"type": "auto_resize"}], "postprocessing": [{"type": "encode_segmentation_mask", "apply_to": "annotation"}, {"type": "resize_segmentation_mask", "apply_to": "prediction"}], "metric": [{"type": "mean_iou", "use_argmax": false, "presenter": "print_scalar", "reference": 0.7267}], "annotationConversion": {}, "adapterConfiguration": {"adapter": {"type": "segmentation", "make_argmax": true}}}\' WHERE name = \'fastseg-large\';')
    op.execute(
        'UPDATE omz_topologies SET advanced_configuration = \'{"preprocessing": [{"type": "auto_resize"}], "postprocessing": [{"type": "encode_segmentation_mask", "apply_to": "annotation"}, {"type": "resize_segmentation_mask", "apply_to": "prediction"}], "metric": [{"type": "mean_iou", "use_argmax": false, "presenter": "print_scalar", "reference": 0.6715}], "annotationConversion": {}, "adapterConfiguration": {"adapter": {"type": "segmentation", "make_argmax": true}}}\' WHERE name = \'fastseg-small\';')


def downgrade():
    raise NotImplementedError(f'Downgrade is not implemented for the {revision} migration')
  
