"""
 OpenVINO DL Workbench
 Import Pipeline creators for model creation

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
from wb.main.pipeline_creators.model_creation.upload_ir_model_pipeline_creator import UploadIRModelPipelineCreator
from wb.main.pipeline_creators.model_creation.upload_keras_model_pipeline_creator import UploadKerasModelPipelineCreator
from wb.main.pipeline_creators.model_creation.upload_original_model_pipeline_creator import \
    UploadOriginalModelPipelineCreator
from wb.main.pipeline_creators.model_creation.configure_model_pipeline_creator import \
    ConfigureModelPipelineCreator
