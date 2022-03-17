"""
 OpenVINO DL Workbench
 InferenceTestImageModel

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
