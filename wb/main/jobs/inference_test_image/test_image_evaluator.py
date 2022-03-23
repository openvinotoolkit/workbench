"""
 OpenVINO DL Workbench
 Test image evaluator

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
from typing import List, Union, Callable

import cv2
import numpy as np
from openvino.tools.accuracy_checker.evaluators import ModelEvaluator
from openvino.tools.accuracy_checker.representation import BaseRepresentation

from wb.main.jobs.inference_test_image.accuracy_checker_representations_serializers import InferencePrediction, \
    serialize
from wb.main.jobs.inference_test_image.test_image_classification_explainer import TestImageClassificationExplainer
from wb.main.shared.enumerates import TaskEnum


class TestImageEvaluator:

    def __init__(self, model_evaluator: ModelEvaluator, task_type: TaskEnum, inputs_len: int):
        self.model_evaluator = model_evaluator
        self.task_type = task_type
        self.inputs_len = inputs_len

    def evaluate(self, image_path: str, mask_path: str = None) -> List[InferencePrediction]:
        image = cv2.imread(image_path)
        inputs: Union[np.array, List[np.array]] = image
        if self.task_type == TaskEnum.super_resolution:
            if self.inputs_len == 1:
                inputs = [image]
            if self.inputs_len == 2:
                inputs = [image, image]
        elif self.task_type == TaskEnum.inpainting:
            inputs = [image, cv2.imread(mask_path)]

        # pass a list to override input values (skip inputs validation)
        prediction: BaseRepresentation = self.model_evaluator.process_single_image(inputs)
        return serialize(prediction)

    def explain(self, image_path: str, progress_cb: Callable[[int], None] = None) -> List[InferencePrediction]:
        if self.task_type != TaskEnum.classification:
            raise RuntimeError(f'Explanation for {self.task_type.value} is not supported')
        return TestImageClassificationExplainer(self.model_evaluator).explain(image_path, progress_cb)
