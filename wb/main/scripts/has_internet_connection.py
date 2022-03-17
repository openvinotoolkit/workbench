"""
 OpenVINO DL Workbench
 Script to check internet connection

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
