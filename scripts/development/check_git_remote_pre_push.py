"""
 Copyright (c) 2020 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
import os
import re
from typing import Optional, Sequence

PROTECTED_REMOTE_URL_REGEXP = r'^((https?:\/\/(www\.)?github\.com\/)|(git@github\.com:))openvinotoolkit\/workbench\.git$'


def main() -> int:
    remote_name = os.environ.get('PRE_COMMIT_REMOTE_NAME')
    remote_url = os.environ.get('PRE_COMMIT_REMOTE_URL')
    if not remote_url:
        print('⚠️  Cannot get remote URL before push. '
              'Check that `pre-commit` dependency installed correctly and all hooks are activated')
        return 1
    if re.search(PROTECTED_REMOTE_URL_REGEXP, str(remote_url).strip()):
        print(f'⛔  Push to remote `{remote_name}` with URL `{remote_url}` is forbidden.')
        return 1
    return 0


if __name__ == '__main__':
    exit(main())
