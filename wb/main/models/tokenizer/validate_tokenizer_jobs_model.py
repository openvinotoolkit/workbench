"""
 OpenVINO DL Workbench
 Validate tokenizer upload job model

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
