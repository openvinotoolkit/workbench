"""
 OpenVINO DL Workbench
 Script to check internet connection

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
import sys
from urllib.error import HTTPError
from urllib.request import urlopen

if __name__ == '__main__':
    GOOD_EXIT_CODE = 0
    BAD_EXIT_CODE = 1
    TOO_MANY_REQUESTS_CODE = 429
    try:
        urlopen('http://www.google.com/', timeout=10)  # nosec: blacklist
        sys.exit(GOOD_EXIT_CODE)
    except HTTPError as error:
        print(error)
        # Handle too many requests error
        if error.code == TOO_MANY_REQUESTS_CODE:
            sys.exit(GOOD_EXIT_CODE)
        sys.exit(BAD_EXIT_CODE)
    except Exception as error:
        print(error)
        sys.exit(BAD_EXIT_CODE)
