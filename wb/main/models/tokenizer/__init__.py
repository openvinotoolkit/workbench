"""
 OpenVINO DL Workbench
 Import Classes for ORM models

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

# in order for database migrations detect models schema changes all models should be imported explicitly

from .tokenizer_model import TokenizerModel, TokenizerToTopologyModel
from .validate_tokenizer_jobs_model import ValidateTokenizerJobModel
from .wait_tokenizer_upload_jobs_model import WaitTokenizerUploadJobsModel
