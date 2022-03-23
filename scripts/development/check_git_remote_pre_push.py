"""
 Copyright (c) 2020 Intel Corporation

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
