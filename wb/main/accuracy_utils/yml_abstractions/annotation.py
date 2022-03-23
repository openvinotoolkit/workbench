"""
 OpenVINO DL Workbench
 Accuracy checker's configuration field abstraction

 Copyright (c) 2019 Intel Corporation

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


class Annotation:
    def __init__(self, **kwargs):
        self.annotation_conversion = {}
        for key, value in kwargs.items():
            self.annotation_conversion[key] = value

    def to_dict(self) -> dict:
        return {
            'annotation_conversion': self.annotation_conversion
        }

    @staticmethod
    def from_dict(data: dict) -> 'Annotation':
        return Annotation(**data)
