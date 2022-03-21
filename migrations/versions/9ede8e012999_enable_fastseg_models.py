"""Enable fastseg models to appear in the OMZ table
Revision ID: 9ede8e012999
Revises: f7fcb58b99cd
Create Date: 2022-02-11 15:23:34.127963
"""

"""
 OpenVINO DL Workbench
 Migration: Enable fastseg models to appear in the OMZ table

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

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9ede8e012999'
down_revision = 'f7fcb58b99cd'
branch_labels = None
depends_on = None


def upgrade():

    op.execute(
        'UPDATE omz_topologies SET advanced_configuration = \'{"preprocessing": [{"type": "auto_resize"}], "postprocessing": [{"type": "encode_segmentation_mask", "apply_to": "annotation"}, {"type": "resize_segmentation_mask", "apply_to": "prediction"}], "metric": [{"type": "mean_iou", "use_argmax": false, "presenter": "print_scalar", "reference": 0.7267}], "annotationConversion": {}, "adapterConfiguration": {"adapter": {"type": "segmentation", "make_argmax": true}}}\' WHERE name = \'fastseg-large\';')
    op.execute(
        'UPDATE omz_topologies SET advanced_configuration = \'{"preprocessing": [{"type": "auto_resize"}], "postprocessing": [{"type": "encode_segmentation_mask", "apply_to": "annotation"}, {"type": "resize_segmentation_mask", "apply_to": "prediction"}], "metric": [{"type": "mean_iou", "use_argmax": false, "presenter": "print_scalar", "reference": 0.6715}], "annotationConversion": {}, "adapterConfiguration": {"adapter": {"type": "segmentation", "make_argmax": true}}}\' WHERE name = \'fastseg-small\';')


def downgrade():
    raise NotImplementedError(f'Downgrade is not implemented for the {revision} migration')
  
