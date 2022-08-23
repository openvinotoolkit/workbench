"""
 OpenVINO DL Workbench
 File for downloading OpenVINO Runtime and Dev wheels

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

import logging as log
import os
import sys
import shutil
from argparse import ArgumentParser
from urllib.parse import urlparse

import requests


def build_argparser():
    log.basicConfig(format='[ %(levelname)s ] %(message)s', level=log.INFO, stream=sys.stdout)
    parser = ArgumentParser()

    parser.add_argument('-l', '--link',
                        help='Link to the package',
                        required=True,
                        type=str)

    parser.add_argument('-o', '--output-path',
                        help='Path where wheels should be stored'
                             'Example: /home/user/folder_for_binaries',
                        required=True,
                        type=str)

    return parser


class WheelsDownloader:
    chunk_size = 1024 * 1024

    def __init__(self, link: str, output_path: str):
        self.link = link
        self.output_path = output_path
        self.downloaded_percent = 0

    def download(self):
        os.makedirs(self.output_path, exist_ok=True)

        package_name = os.path.basename(urlparse(self.link).path)
        package_path = os.path.join(self.output_path, package_name)

        self._download_package(self.link, package_path)
        self._unpack(self.output_path, package_path)

    def _unpack(self, output_path: str, package_path: str):
        shutil.unpack_archive(package_path, output_path)
        os.remove(package_path)

    def _download_package(self, package_link: str, package_path: str):
        link_content = requests.get(package_link, stream=True)

        if link_content.status_code != 200:
            log.warning(f'Package at link {package_link} does not exist or the link is not available.')
            return

        with open(package_path, 'wb') as wheel_file:
            total_file_size = int(link_content.headers.get('content-length'))

            for data_packet in link_content.iter_content(chunk_size=self.chunk_size):
                wheel_file.write(data_packet)
                self.downloaded_percent += 100 * len(data_packet) / total_file_size
                log.info('Total progress - %s', self.downloaded_percent)


if __name__ == '__main__':
    ARGS = build_argparser().parse_args()
    sys.exit(WheelsDownloader(ARGS.link, ARGS.output_path).download())
