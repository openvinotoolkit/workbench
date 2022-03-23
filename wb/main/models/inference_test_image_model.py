"""
 OpenVINO DL Workbench
 InferenceTestImageModel

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
from typing import Optional

from sqlalchemy import Column, Integer, ForeignKey, String

from wb.main.models.artifacts_model import ArtifactsModel


class InferenceTestImageModel(ArtifactsModel):
    __tablename__ = 'inference_test_images'

    __mapper_args__ = {
        'polymorphic_identity': 'inference_test_image'
    }

    id = Column(Integer, ForeignKey('artifacts.id'), primary_key=True)

    predictions = Column(String, nullable=True)

    reference_predictions = Column(String, nullable=True)

    @property
    def image_path(self) -> str:
        return self.files[0].path

    @property
    def mask_path(self) -> Optional[str]:
        try:
            return self.files[1].path
        except (IndexError, AttributeError):
            return None

    def json(self) -> dict:
        return {
            'id': self.id,
            'predictions': json.loads(self.predictions) if self.predictions else None,
            'refPredictions': json.loads(self.reference_predictions) if self.reference_predictions else None
        }
