"""
 OpenVINO DL Workbench
 Validate tokenizer upload job model

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

from sqlalchemy import Integer, Column, ForeignKey
from sqlalchemy.orm import relationship, backref

from wb.main.enumerates import JobTypesEnum
from wb.main.models.jobs_model import JobsModel
from wb.main.models.tokenizer import TokenizerModel
from wb.main.models.tokenizer.wait_tokenizer_upload_jobs_model import TokenizerUploadJobData


class ValidateTokenizerJobModel(JobsModel):
    __tablename__ = 'validate_tokenizer_jobs'

    __mapper_args__ = {
        'polymorphic_identity': JobTypesEnum.validate_tokenizer_type.value
    }

    job_id = Column(Integer, ForeignKey(JobsModel.job_id), primary_key=True)
    tokenizer_id = Column(Integer, ForeignKey(TokenizerModel.id), nullable=False)

    tokenizer: TokenizerModel = relationship(
        TokenizerModel,
        foreign_keys=[tokenizer_id],
        uselist=False,
        backref=backref('validate_tokenizer_jobs', cascade='delete,all')
    )

    def __init__(self, data: TokenizerUploadJobData):
        super().__init__(data)
        self.tokenizer_id = data['tokenizer_id']
        self.topology_id = data['model_id']

    def json(self) -> dict:
        return {
            **super().json(),
            'tokenizer': self.tokenizer.json(),
        }
