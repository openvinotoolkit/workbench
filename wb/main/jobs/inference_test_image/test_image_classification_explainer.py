"""
 OpenVINO DL Workbench
 Test image explainer

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
import base64
from typing import List, Callable, Tuple

import cv2
import numpy as np
from openvino._pyopenvino import Layout
from openvino.tools.accuracy_checker.evaluators import ModelEvaluator
from openvino.tools.accuracy_checker.representation import ClassificationPrediction

from wb.main.jobs.inference_test_image.accuracy_checker_representations_serializers import InferencePrediction
from wb.main.jobs.inference_test_image.rise import RISE


class TestImageClassificationExplainer:

    def __init__(self, model_evaluator: ModelEvaluator):
        self.model_evaluator = model_evaluator

        first_input = list(model_evaluator.launcher.inputs.values())[0]
        input_layout: Layout = first_input.layout
        shape = first_input.shape

        h_index = input_layout.get_index_by_name('H')
        w_index = input_layout.get_index_by_name('W')

        self.image_info_inputs = shape[h_index], shape[w_index]

        self.rise = RISE(self.image_info_inputs)

    def explain(self, image_path: str, progress_cb: Callable[[int], None] = None) -> List[InferencePrediction]:
        test_image = cv2.imread(image_path)
        result: ClassificationPrediction = self.model_evaluator.process_single_image(test_image)

        top_k = min(5, len(result.scores))
        top_k_labels = result.top_k(top_k)

        explanations = self.rise.explain(lambda x: self.model_evaluator.process_single_image(x).scores,
                                         cv2.resize(test_image, self.image_info_inputs),
                                         progress_cb)

        predictions: List[InferencePrediction] = []

        for label_id in top_k_labels:
            prediction = InferencePrediction()
            prediction.category_id = int(label_id)
            prediction.score = float(result.scores[label_id])
            prediction.explanation_mask = self.to_base64_heat_mask(
                explanations[label_id],
                (test_image.shape[1], test_image.shape[0])
            )
            predictions.append(prediction)

        return predictions

    @classmethod
    def to_base64_heat_mask(cls, explanation: np.array, size: Tuple[int, int]) -> str:
        explanation_mask = cv2.resize(cls.to_heat_mask(explanation), size)
        _, buffer = cv2.imencode('.jpg', explanation_mask)
        return base64.b64encode(buffer).decode('utf-8')

    @staticmethod
    def to_heat_mask(mask: np.array) -> np.array:
        heat_mask = cv2.normalize(mask, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX).astype(np.uint8)
        return cv2.applyColorMap(heat_mask, cv2.COLORMAP_JET)
