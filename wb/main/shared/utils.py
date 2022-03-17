"""
 OpenVINO DL Workbench
 Shared utility functions for both local and remote usage and scripts

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
