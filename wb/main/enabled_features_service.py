"""
 OpenVINO DL Workbench
 Service to store enabled preview features

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
import json
from enum import Enum
from pathlib import Path
from typing import Set, List

from config.constants import ENABLED_FEATURE_PREVIEW_FILE

FEATURE_FLAG_ENABLED = True


class SupportedFeatures(Enum):
    DYNAMIC_SHAPES = 'DYNAMIC_SHAPES'
    HUGGING_FACE_MODELS = 'HUGGING_FACE_MODELS'


class SingletonServiceMeta(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(SingletonServiceMeta, cls).__call__(*args, **kwargs)
        return cls._instances[cls]


class EnabledFeaturesService(metaclass=SingletonServiceMeta):
    def __init__(self, config_file_path: Path = ENABLED_FEATURE_PREVIEW_FILE):
        if not FEATURE_FLAG_ENABLED:
            return
        self._enabled_features: Set[SupportedFeatures] = self._read_features_from_config(config_file_path)

    @staticmethod
    def _read_features_from_config(config_file_path: Path) -> Set[SupportedFeatures]:
        enabled_features = set()
        with config_file_path.open() as config_file:
            features = json.load(config_file)
        for feature_name, is_enabled in features.items():
            if int(is_enabled):
                feature_name = SupportedFeatures(feature_name)
                enabled_features.add(feature_name)
        return enabled_features

    def is_feature_enabled(self, feature: SupportedFeatures) -> bool:
        if not FEATURE_FLAG_ENABLED:
            return False
        if feature not in SupportedFeatures:
            raise f'{feature.value} is not supported'
        return feature in self._enabled_features

    @property
    def enabled_features(self) -> List[str]:
        if not FEATURE_FLAG_ENABLED:
            return []
        return [feature.value for feature in self._enabled_features]
