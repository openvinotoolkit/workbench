"""
 OpenVINO DL Workbench
 Labels

 Copyright (c) 2020 Intel Corporation

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
import json
import os
from typing import List

from typing_extensions import TypedDict

from config.constants import DATASET_LABELS_PATH


class LabelSetDict(TypedDict):
    name: str
    path: str


IMAGENET_LABEL_SET = LabelSetDict(
    name='imagenet_1000',
    path=os.path.join(DATASET_LABELS_PATH, 'imagenet_1000_labels.json'))

COCO_LABEL_SET = LabelSetDict(
    name='coco_orig_paper_91',
    path=os.path.join(DATASET_LABELS_PATH, 'coco_orig_paper_91_labels.json'))

VOC_LABEL_SET = LabelSetDict(
    name='voc',
    path=os.path.join(DATASET_LABELS_PATH, 'voc_labels.json'))

LABEL_SETS: List[LabelSetDict] = [
    IMAGENET_LABEL_SET,
    COCO_LABEL_SET,
    VOC_LABEL_SET
]


class LabelSet:
    set_id: int
    name: str
    labels = {}

    def __init__(self, set_id: int, name: str, labels_path: str = None):
        self.set_id = set_id
        self.name = name
        if labels_path:
            with open(labels_path) as file:
                self.labels = json.loads(file.read())

    def json(self) -> dict:
        return {
            'id': self.set_id,
            'name': self.name,
            'labels': self.labels
        }


def get_datasets_label_sets() -> List[dict]:
    result = [
        LabelSet(0, 'none').json()
    ]
    for label_set in LABEL_SETS:
        result.append(LabelSet(len(result), label_set['name'], label_set['path']).json())

    return result
