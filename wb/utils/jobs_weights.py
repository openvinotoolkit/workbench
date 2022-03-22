"""
 OpenVINO DL Workbench
 Class for storing weights of jobs in chains

 Copyright (c) 2018 Intel Corporation

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
from wb.main.enumerates import JobTypesEnum


class JobsWeight:
    @staticmethod
    def upload_artifact():
        return {
            JobTypesEnum.iuploader_type: 0.6
        }

    @staticmethod
    def upload_dataset():
        return {
            **JobsWeight.upload_artifact(),
            JobTypesEnum.extract_dataset_type: 0.15,
            JobTypesEnum.recognize_dataset_type: 0.10,
            JobTypesEnum.validate_dataset_type: 0.15,
        }

    @staticmethod
    def upload_openvino_model():
        return {
            **JobsWeight.upload_artifact(),
            JobTypesEnum.model_analyzer_type: 0.4,
        }

    @staticmethod
    def upload_source_model():
        return {
            JobTypesEnum.iuploader_type: 1
        }

    @staticmethod
    def upload_and_convert_openvino_model():
        return {
            **JobsWeight.upload_artifact(),
            JobTypesEnum.model_optimizer_scan_type: 0.05,
            JobTypesEnum.model_optimizer_type: 0.3,
            JobTypesEnum.model_analyzer_type: 0.05,
            JobTypesEnum.convert_keras_type: 0.01,
        }

    @staticmethod
    def model_optimizer():
        return {
            JobTypesEnum.model_optimizer_type: 0.9,
            JobTypesEnum.model_analyzer_type: 0.1,
        }

    @staticmethod
    def download_model():
        return {
            JobTypesEnum.omz_model_download_type: 0.4
        }

    @staticmethod
    def download_openvino_model():
        return {
            **JobsWeight.download_model(),
            JobTypesEnum.omz_model_move_type: 0.3,
            JobTypesEnum.model_analyzer_type: 0.3,
        }

    @staticmethod
    def download_source_model():
        return {
            **JobsWeight.download_model(),
            JobTypesEnum.model_convert_type: 0.4,
            JobTypesEnum.omz_model_move_type: 0.1,
            JobTypesEnum.model_analyzer_type: 0.1,
        }
