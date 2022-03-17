"""Add new yolo task methods

Revision ID: a291f54f85ec
Revises: a51e30ac4654
Create Date: 2021-05-12 15:16:47.636215

"""

"""
 OpenVINO DL Workbench
 Migration: Add new YOLO task method enum values

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
from sqlalchemy import orm

revision = 'a291f54f85ec'
down_revision = 'a51e30ac4654'
branch_labels = None
depends_on = None

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
    'super_resolution',
    'face_recognition',
    'landmark_detection',
    'custom',
)

new_task_methods = (
    *old_task_methods,
    'yolo_v3',
    'yolo_v4',
    'tiny_yolo_v3_v4'
)

task_method_migrator = SQLEnumMigrator(
    (('omz_topologies', 'topology_type'), ('topologies_metadata', 'topology_type')),
    'taskmethodenum',
    old_task_methods,
    new_task_methods
)


def upgrade():
    # 1: handle enums
    # 2: handle new omz models

    task_method_migrator.upgrade()

    op.execute(
        'UPDATE public.omz_topologies SET description = \'YOLO v3 is a real-time object detection model implemented with Keras* from this repository <https://github.com/david8862/keras-YOLOv3-model-set> and converted to TensorFlow* framework. This model was pre-trained on Common Objects in Context (COCO) <https://cocodataset.org/#home> dataset with 80 classes.\', framework = \'tf\', license_url = \'https://raw.githubusercontent.com/david8862/keras-YOLOv3-model-set/master/LICENSE\', path = \'public/yolo-v3-tf\', task_type = \'object_detection\', topology_type = \'yolo_v3\', advanced_configuration = \'{"preprocessing": [{"type": "resize", "size": 416}], "postprocessing": [{"type": "resize_prediction_boxes"}, {"type": "filter", "apply_to": "prediction", "min_confidence": 0.001, "remove_filtered": true}, {"type": "nms", "overlap": 0.5}, {"type": "clip_boxes", "apply_to": "prediction"}], "metric": [{"type": "map", "integral": "11point", "ignore_difficult": true, "presenter": "print_scalar"}, {"type": "coco_precision", "max_detections": 100, "threshold": 0.5}], "annotationConversion": {"has_background": false, "use_full_label_map": false}, "adapterConfiguration": {"outputs": {"type": "yolo_v3", "anchors": "10,13,  16,30,  33,23,  30,61,  62,45,  59,119,  116,90,  156,198,  373,326", "num": 9, "coords": 4, "classes": 80, "anchor_masks": [[6, 7, 8], [3, 4, 5], [0, 1, 2]], "outputs": ["conv2d_58/Conv2D/YoloRegion", "conv2d_66/Conv2D/YoloRegion", "conv2d_74/Conv2D/YoloRegion"]}}}\', inputs = null WHERE name = \'yolo-v3-tf\';')
    op.execute(
        'UPDATE public.omz_topologies SET description = \'YOLO v3 Tiny is a real-time object detection model implemented with Keras* from this repository <https://github.com/david8862/keras-YOLOv3-model-set> and converted to TensorFlow* framework. This model was pre-trained on Common Objects in Context (COCO) <https://cocodataset.org/#home> dataset with 80 classes.\', framework = \'tf\', license_url = \'https://raw.githubusercontent.com/david8862/keras-YOLOv3-model-set/master/LICENSE\', path = \'public/yolo-v3-tiny-tf\', task_type = \'object_detection\', topology_type = \'tiny_yolo_v3_v4\', advanced_configuration = \'{"preprocessing": [{"type": "resize", "size": 416}], "postprocessing": [{"type": "resize_prediction_boxes"}, {"type": "filter", "apply_to": "prediction", "min_confidence": 0.001, "remove_filtered": true}, {"type": "nms", "overlap": 0.5}, {"type": "clip_boxes", "apply_to": "prediction"}], "metric": [{"type": "map", "integral": "11point", "ignore_difficult": true, "presenter": "print_scalar"}, {"type": "coco_precision", "max_detections": 100, "threshold": 0.5}], "annotationConversion": {"has_background": false, "use_full_label_map": false}, "adapterConfiguration": {"outputs": {"type": "yolo_v3", "anchors": "tiny_yolo_v3", "num": 3, "coords": 4, "classes": 80, "threshold": 0.001, "anchor_masks": [[3, 4, 5], [1, 2, 3]], "outputs": ["conv2d_9/Conv2D/YoloRegion", "conv2d_12/Conv2D/YoloRegion"]}}}\', inputs = null WHERE name = \'yolo-v3-tiny-tf\';')
    op.execute(
        'UPDATE public.omz_topologies SET description = \'YOLO v4 is a real-time object detection model based on "YOLOv4: Optimal Speed and Accuracy of Object Detection" <https://arxiv.org/abs/2004.10934> paper. It was implemented in Keras* framework and converted to TensorFlow* framework. For details see repository <https://github.com/david8862/keras-YOLOv3-model-set>. This model was pre-trained on Common Objects in Context (COCO) <https://cocodataset.org/#home> dataset with 80 classes.\', framework = \'tf\', license_url = \'https://raw.githubusercontent.com/david8862/keras-YOLOv3-model-set/master/LICENSE\', path = \'public/yolo-v4-tf\', task_type = \'object_detection\', topology_type = \'yolo_v4\', advanced_configuration = \'{"preprocessing": [{"type": "resize", "size": 608}], "postprocessing": [{"type": "resize_prediction_boxes"}, {"type": "filter", "apply_to": "prediction", "min_confidence": 0.001, "remove_filtered": true}, {"type": "diou_nms", "overlap": 0.5}, {"type": "clip_boxes", "apply_to": "prediction"}], "metric": [{"type": "map", "integral": "11point", "ignore_difficult": true, "presenter": "print_scalar"}, {"name": "AP@0.5", "type": "coco_precision", "max_detections": 100, "threshold": 0.5}, {"name": "AP@0.5:0.05:95", "type": "coco_precision", "max_detections": 100, "threshold": "0.5:0.05:0.95"}], "annotationConversion": {"has_background": false, "use_full_label_map": false}, "adapterConfiguration": {"outputs": {"type": "yolo_v3", "anchors": "12,16,19,36,40,28,36,75,76,55,72,146,142,110,192,243,459,401", "num": 3, "coords": 4, "classes": 80, "threshold": 0.001, "anchor_masks": [[0, 1, 2], [3, 4, 5], [6, 7, 8]], "raw_output": true, "outputs": ["conv2d_93/BiasAdd/Add", "conv2d_101/BiasAdd/Add", "conv2d_109/BiasAdd/Add"]}}}\', inputs = null WHERE name = \'yolo-v4-tf\';')
    op.execute(
        'UPDATE public.omz_topologies SET description = \'YOLO v4 Tiny is a real-time object detection model based on "YOLOv4: Optimal Speed and Accuracy of Object Detection" <https://arxiv.org/abs/2004.10934> paper. It was implemented in Keras* framework and converted to TensorFlow* framework. For details see repository <https://github.com/david8862/keras-YOLOv3-model-set>. This model was pre-trained on Common Objects in Context (COCO) <https://cocodataset.org/#home> dataset with 80 classes.\', framework = \'tf\', license_url = \'https://raw.githubusercontent.com/david8862/keras-YOLOv3-model-set/master/LICENSE\', path = \'public/yolo-v4-tiny-tf\', task_type = \'object_detection\', topology_type = \'tiny_yolo_v3_v4\', advanced_configuration = \'{"preprocessing": [{"type": "resize", "size": 416}], "postprocessing": [{"type": "resize_prediction_boxes"}, {"type": "filter", "apply_to": "prediction", "min_confidence": 0.001, "remove_filtered": true}, {"type": "diou_nms", "overlap": 0.5}, {"type": "clip_boxes", "apply_to": "prediction"}], "metric": [{"type": "map", "integral": "11point", "ignore_difficult": true, "presenter": "print_scalar"}, {"name": "AP@0.5", "type": "coco_precision", "max_detections": 100, "threshold": 0.5}, {"name": "AP@0.5:0.05:95", "type": "coco_precision", "max_detections": 100, "threshold": "0.5:0.05:0.95"}], "annotationConversion": {"has_background": false, "use_full_label_map": false}, "adapterConfiguration": {"outputs": {"type": "yolo_v3", "anchors": "10,14,23,27,37,58,81,82,135,169,344,319", "num": 2, "coords": 4, "classes": 80, "threshold": 0.001, "anchor_masks": [[1, 2, 3], [3, 4, 5]], "raw_output": true, "outputs": ["conv2d_20/BiasAdd/Add", "conv2d_17/BiasAdd/Add"]}}}\', inputs = null WHERE name = \'yolo-v4-tiny-tf\';')

    bind = op.get_bind()
    session = orm.Session(bind=bind)
    session.flush()


def downgrade():
    raise NotImplementedError('downgrade is not supported')
