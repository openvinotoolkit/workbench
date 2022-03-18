"""
 OpenVINO DL Workbench
 Shared utility functions for both local and remote usage and scripts

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
from typing import Union, Iterable, Type, Iterator

from itertools import chain


def find_all_paths_by_exts(
        dir_path: Union[str, Path],
        extensions: Iterable,
        recursive: bool = False,
        result_type: Type[Union[str, Path]] = str) -> Iterator[Union[str, Path]]:
    """
    Yield all file paths with matching extensions from given directory.

    Being given 'xml' will search for both 'xml' and 'XML' extensions.
    """
    pattern = '**/*.' if recursive else '*.'
    exts = chain.from_iterable((ext.lower(), ext.upper()) for ext in extensions)
    paths = chain.from_iterable(Path(dir_path).glob(pattern + ext) for ext in exts)
    return (result_type(path) for path in paths)
