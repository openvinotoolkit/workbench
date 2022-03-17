"""
 OpenVINO DL Workbench
 Service to store enabled preview features

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
import json
from enum import Enum
from pathlib import Path
from typing import Set, List

from config.constants import ENABLED_FEATURE_PREVIEW_FILE

FEATURE_FLAG_ENABLED = True


class SupportedFeatures(Enum):
    DYNAMIC_SHAPES = 'DYNAMIC_SHAPES'
    OMZ_REDESIGN = 'OMZ_REDESIGN'
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
