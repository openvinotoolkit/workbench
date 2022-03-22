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
from typing import Optional

from wb.main.accuracy_utils.yml_abstractions.annotation import Annotation
from wb.main.accuracy_utils.yml_abstractions.typed_parameter import DataReader, Postprocessing, Preprocessing, Metric


class Dataset:
    def __init__(self,
                 data_source: Optional[str],
                 annotation: Optional[Annotation],
                 preprocessing: list,
                 postprocessing: list,
                 metrics: Optional[list],
                 subsample_size: str = '100%'):
        self.data_source = data_source
        self.annotation = annotation
        self.preprocessing = [] if preprocessing is None else preprocessing
        self.postprocessing = [] if postprocessing is None else postprocessing
        self.metrics = [] if metrics is None else metrics
        self.subsample_size = subsample_size
        self.data_reader = None
        self.extra_source = None

    def set_data_reader(self, reader: dict):
        if reader:
            self.data_reader = DataReader.from_dict(reader)

    def set_extra_source(self, source: str):
        self.extra_source = source

    def to_dict(self) -> dict:
        dataset = {
            'name': 'dataset',
            'data_source': self.data_source,
            'annotation_conversion': self.annotation.to_dict()['annotation_conversion'] if self.annotation else None,
            'subsample_size': self.subsample_size
        }
        if self.data_reader:
            dataset['reader'] = self.data_reader.to_dict()

        if self.extra_source:
            dataset['additional_data_source'] = self.extra_source

        if self.preprocessing:
            dataset['preprocessing'] = list(map(lambda obj: obj.to_dict(), self.preprocessing))

        if self.postprocessing:
            dataset['postprocessing'] = list(map(lambda obj: obj.to_dict(), self.postprocessing))

        if self.metrics:
            dataset['metrics'] = list(map(lambda obj: obj.to_dict(), self.metrics))

        return dataset

    @staticmethod
    def from_dict(data: dict) -> 'Dataset':
        required_fields = {'data_source',
                           'annotation_conversion',
                           'metrics'
                           }
        if required_fields > set(data):
            raise KeyError('not all of the required fields ({}) are present in the dictionary'
                           .format(required_fields))
        subset_size = data.get('subsample_size')

        dataset = Dataset(data_source=data['data_source'],
                          annotation=Annotation(**data['annotation_conversion']),
                          preprocessing=Preprocessing.from_list(data.get('preprocessing', [])),
                          postprocessing=Postprocessing.from_list(data.get('postprocessing', [])),
                          metrics=Metric.from_list(data['metrics']),
                          subsample_size=subset_size if subset_size is not None else '100%')
        dataset.set_data_reader(data.get('reader'))
        dataset.set_extra_source(data.get('additional_data_source'))
        return dataset
