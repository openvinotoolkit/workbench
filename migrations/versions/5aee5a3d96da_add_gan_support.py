"""add gan support

Revision ID: 5aee5a3d96da
Revises: d3bd782fa555
Create Date: 2020-11-09 16:19:13.303734

"""

"""
 OpenVINO DL Workbench
 Migration: Add gan support

 Copyright (c) 2020 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""


import datetime
from typing import Tuple

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
from sqlalchemy import Column, Integer, DateTime, orm, String
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.declarative import declarative_base

from migrations.utils.sql_enum_migrator import SQLEnumMigrator

revision = '5aee5a3d96da'
down_revision = 'b9bfeb130aff'
branch_labels = None
depends_on = None

old_task_types = (
    'classification',
    'object_detection',
    'instance_segmentation',
    'semantic_segmentation',
    'generic'
)

new_task_types = (
    'classification',
    'object_detection',
    'instance_segmentation',
    'semantic_segmentation',
    'inpainting',
    'style_transfer',
    'super_resolution',
    'generic'
)

old_task_methods = (
    'classificator',
    'generic',
    'ssd',
    'tiny_yolo_v2',
    'yolo_v2',
    'mask_rcnn',
    'segmentation',
)

new_task_methods = (
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

old_dataset_types = (
    'imagenet',
    'voc',
    'coco',
    'common_semantic_segmentation',
    'not_annotated',
)

new_dataset_types = (
    'imagenet',
    'voc',
    'coco',
    'common_semantic_segmentation',
    'common_super_resolution',
    'not_annotated',
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

Base = declarative_base()


class _DatasetModel(Base):
    __tablename__ = 'datasets'

    id = Column(Integer, primary_key=True)
    dataset_type = Column(String)


class _DatasetTask(Base):
    __tablename__ = 'dataset_tasks'

    id = Column(Integer, primary_key=True)
    dataset_id = Column(Integer)
    creation_timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    last_modified = Column(DateTime, onupdate=datetime.datetime.utcnow, default=datetime.datetime.utcnow)

    task_type = Column('task_type',
                       postgresql.ENUM('inpainting', 'style_transfer', 'super_resolution', name='taskenum'),
                       autoincrement=False, nullable=False)

    def __init__(self, dataset_id: int, task_type: str):
        self.dataset_id = dataset_id
        self.task_type = task_type


def upgrade():
    # 1: handle enums
    # 2: handle new omz models
    # 3: handle new dataset task_types

    task_type_migrator.upgrade()
    task_method_migrator.upgrade()
    dataset_type_migrator.upgrade()

    op.execute(
        'UPDATE public.omz_topologies SET description = \'Super resolution model\', framework = \'openvino\', license_url = \'https://raw.githubusercontent.com/opencv/open_model_zoo/master/LICENSE\', path = \'intel/single-image-super-resolution-1032\', task_type = \'super_resolution\', topology_type = \'super_resolution\', advanced_configuration = \'{"preprocessing": [{"type": "auto_resize"}], "postprocessing": [{"type": "resize", "apply_to": "prediction"}], "metric": [{"type": "psnr", "scale_border": 4, "presenter": "print_vector"}], "annotationConversion": {"two_streams": true}, "adapterConfiguration": {"outputs": {"type": "super_resolution", "reverse_channels": true}}}\', inputs = \'[{"name": "0", "type": "INPUT", "value": ".*lr_x4*.png"}, {"name": "1", "type": "INPUT", "value": ".*upsample_x4*.png"}]\' WHERE name = \'single-image-super-resolution-1032\';')
    op.execute(
        'UPDATE public.omz_topologies SET description = \'Super resolution model\', framework = \'openvino\', license_url = \'https://raw.githubusercontent.com/opencv/open_model_zoo/master/LICENSE\', path = \'intel/single-image-super-resolution-1033\', task_type = \'super_resolution\', topology_type = \'super_resolution\', advanced_configuration = \'{"preprocessing": [{"type": "auto_resize"}], "postprocessing": [{"type": "resize", "apply_to": "prediction"}], "metric": [{"type": "psnr", "scale_border": 4, "presenter": "print_vector"}], "annotationConversion": {"two_streams": true}, "adapterConfiguration": {"outputs": {"type": "super_resolution", "reverse_channels": true}}}\', inputs = \'[{"name": "0", "type": "INPUT", "value": ".*lr_x3*.png"}, {"name": "1", "type": "INPUT", "value": ".*upsample_x3*.png"}]\' WHERE name = \'single-image-super-resolution-1033\';')
    op.execute(
        'UPDATE public.omz_topologies SET description = \'Super resolution model\', framework = \'openvino\', license_url = \'https://raw.githubusercontent.com/opencv/open_model_zoo/master/LICENSE\', path = \'intel/text-image-super-resolution-0001\', task_type = \'super_resolution\', topology_type = \'super_resolution\', advanced_configuration = \'{"preprocessing": [{"type": "bgr_to_gray"}, {"type": "auto_resize"}], "postprocessing": [{"type": "resize", "apply_to": "prediction"}], "metric": [{"type": "psnr", "scale_border": 4, "presenter": "print_vector"}], "annotationConversion": {}, "adapterConfiguration": {"outputs": {"type": "super_resolution"}}}\', inputs = null WHERE name = \'text-image-super-resolution-0001\';')
    op.execute(
        'UPDATE public.omz_topologies SET description = \'The `fast-neural-style-mosaic-onnx` model is one of the style transfer models designed to mix the content of an image with the style of another image. The model uses the method described in Perceptual Losses for Real-Time Style Transfer and Super-Resolution <https://arxiv.org/abs/1603.08155> along with Instance Normalization <https://arxiv.org/pdf/1607.08022.pdf>.\', framework = \'onnx\', license_url = \'https://raw.githubusercontent.com/onnx/models/master/LICENSE\', path = \'public/fast-neural-style-mosaic-onnx\', task_type = \'style_transfer\', topology_type = \'style_transfer\', advanced_configuration = \'{"preprocessing": [{"type": "resize", "size": 224}], "postprocessing": [{"type": "resize_style_transfer", "dst_width": 224, "dst_height": 224}], "metric": [{"type": "psnr", "scale_border": 0, "presenter": "print_vector"}, {"type": "ssim", "presenter": "print_vector"}], "annotationConversion": {}, "adapterConfiguration": {"outputs": {"type": "style_transfer"}}}\', inputs = null WHERE name = \'fast-neural-style-mosaic-onnx\';')
    op.execute(
        'UPDATE public.omz_topologies SET description = \'The `gmcnn-places2-tf` is the TensorFlow implementation of GMCNN Image Inpainting model, aimed to estimate suitable pixel information to fill holes in images. `gmcnn-places2-tf` is trained on Places2 dataset. For details see repository <https://github.com/shepnerd/inpainting_gmcnn>.\', framework = \'tf\', license_url = \'https://raw.githubusercontent.com/shepnerd/inpainting_gmcnn/master/LICENSE\', path = \'public/gmcnn-places2-tf\', task_type = \'generic\', topology_type = \'generic\', advanced_configuration = \'null\', inputs = null WHERE name = \'gmcnn-places2-tf\';')

    bind = op.get_bind()
    session = orm.Session(bind=bind)
    session.flush()
    for dataset in session.query(_DatasetModel).all():
        if dataset.dataset_type in ['imagenet', 'voc', 'coco', 'common_semantic_segmentation']:
            session.add(_DatasetTask(dataset.id, 'inpainting'))
            session.add(_DatasetTask(dataset.id, 'style_transfer'))
    session.flush()


def downgrade():
    raise NotImplementedError('downgrade is not supported')
