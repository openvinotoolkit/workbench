"""
 OpenVINO DL Workbench
 Import Classes for ORM models

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

# in order for database migrations detect models schema changes all models should be imported explicitly

from .tokenizer_model import TokenizerModel, TokenizerToTopologyModel
from .validate_tokenizer_jobs_model import ValidateTokenizerJobModel
from .wait_tokenizer_upload_jobs_model import WaitTokenizerUploadJobsModel
