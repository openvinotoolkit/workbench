"""
 OpenVINO DL Workbench
 Class for extracting columns from text dataset

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
from pathlib import Path
from typing import List, Union, Callable

import pandas

from wb.error.job_error import ArtifactError
from wb.main.enumerates import StatusEnum
from wb.main.utils.utils import create_empty_dir


class TextDataExtractor:
    def __init__(
            self,
            file_id: int,
            file_name: str,
            file_path: Path,
            extract_path: Path
    ):
        self.file_id = file_id
        self.file_name = file_name
        self.file_path = file_path
        self.extract_path = extract_path

    def extract_text_dataset(
            self,
            header: bool,
            separator: str,
            encoding: str,
            columns: List[int],
            update_state: Callable,
    ) -> pandas.DataFrame:
        target_path = self.extract_path / str(self.file_id)
        update_state(status=StatusEnum.running, progress=10)
        create_empty_dir(target_path)

        if Path(self.file_name).suffix not in ('.csv', '.tsv', '.txt'):
            message = 'Unsupported file type. Supported file extensions: csv, tsv, txt.'
            update_state(status=StatusEnum.error, error_message=message)
            raise ArtifactError(message, 1)

        header = 0 if header else None
        dataset = pandas.read_csv(
            self.file_path,
            sep=separator,
            header=header,
            encoding=encoding,
        )
        columns_order = self._get_columns_order(dataset, columns)
        dataset = dataset[columns_order]

        dataset.to_csv(
            target_path / self.file_name,
            header=False,
            index=False,
        )
        return dataset

    @staticmethod
    def _get_columns_order(dataset: pandas.DataFrame, column_order: List[int]) -> List[Union[int, str]]:
        return [dataset.columns[idx] for idx in column_order]
