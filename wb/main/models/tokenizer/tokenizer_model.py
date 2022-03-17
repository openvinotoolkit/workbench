"""
 OpenVINO DL Workbench
 Class for ORM model describing tokenizers

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
from typing import List

from sqlalchemy import Column, Integer, ForeignKey, Boolean, event
from sqlalchemy.orm import relationship, backref, Mapper

from wb.main.enumerates import TokenizerTypeEnum
from wb.main.models import ArtifactsModel, BaseModel
from wb.main.models.enumerates import TOKENIZER_TYPE_ENUM_SCHEMA
from wb.main.utils.utils import remove_dir


class TokenizerToTopologyModel(BaseModel):
    __tablename__ = 'tokenizer_to_topology'

    tokenizer_id: int = Column(Integer, ForeignKey('tokenizers.id'), primary_key=True)
    topology_id: int = Column(Integer, ForeignKey('topologies.id'), primary_key=True)
    selected: bool = Column(Boolean, nullable=False, default=False)

    model: 'TopologiesModel' = relationship(
        'TopologiesModel',
        uselist=False,
        backref=backref('tokenizers_to_topology', cascade='delete,all')
    )

    def __init__(self, tokenizer_id: int, topology_id: int):
        self.tokenizer_id = tokenizer_id
        self.topology_id = topology_id


class TokenizerModel(ArtifactsModel):
    __tablename__ = 'tokenizers'

    __mapper_args__ = {
        'polymorphic_identity': __tablename__
    }

    id: int = Column(Integer, ForeignKey(ArtifactsModel.id), primary_key=True)
    tokenizer_type: TokenizerTypeEnum = Column(TOKENIZER_TYPE_ENUM_SCHEMA, nullable=False)
    vocab_size: int = Column(Integer)

    tokenizers_to_topology: List[TokenizerToTopologyModel] = relationship(
        'TokenizerToTopologyModel',
        cascade='delete,all',
        backref=backref('tokenizer', uselist=False, cascade='delete,all')
    )

    selected = False

    def __init__(self, name: str, tokenizer_type: TokenizerTypeEnum):
        super().__init__(name)
        self.tokenizer_type = tokenizer_type

    def remove_files(self):
        remove_dir(self.path)

    def json(self):
        return {
            **super().json(),
            'type': self.tokenizer_type.value,
            'vocabSize': self.vocab_size,
            # set dynamically in topology model
            'selected': self.selected,
        }


@event.listens_for(TokenizerToTopologyModel, 'after_update')
def add_or_update_tokenizer_data_in_jupyter_notebooks(
        _: Mapper, unused_connection, tokenizer_to_topology: TokenizerToTopologyModel
) -> None:
    if tokenizer_to_topology.selected:
        for project in tokenizer_to_topology.model.projects:
            project.jupyter_notebook.update_notebook_by_orm_event(TokenizerToTopologyModel.__name__, 'after_update')


@event.listens_for(TokenizerModel, 'after_delete')
def remove_tokenizer_data_it_jupyter_notebooks(_: Mapper, unused_connection, tokenizer: TokenizerModel):
    models = [tokenizer_to_topology.model for tokenizer_to_topology in tokenizer.tokenizers_to_topology]
    for model in models:
        for project in model.projects:
            # check in case notebook deleted within project deletion by model cascade delete
            if project.jupyter_notebook.notebook_exists:
                project.jupyter_notebook.update_notebook_by_orm_event(TokenizerModel.__name__, 'after_delete')
