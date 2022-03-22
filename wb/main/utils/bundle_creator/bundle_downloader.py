"""
 OpenVINO DL Workbench
 File for downloading and unpacking bundles

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

from argparse import ArgumentParser

import logging as log

import os
import shutil
import sys
import requests


def build_argparser():
    log.basicConfig(format='[ %(levelname)s ] %(message)s', level=log.INFO, stream=sys.stdout)
    parser = ArgumentParser()

    parser.add_argument('-l', '--link',
                        help='Link to the deployment archives',
                        required=True,
                        type=str)

    parser.add_argument('-os',
                        help='One or more operation systems'
                             'Example: ubuntu18 ubuntu20',
                        required=True,
                        type=str,
                        nargs='+',
                        choices=['ubuntu18', 'ubuntu20'])

    parser.add_argument('-o', '--output-path',
                        help='Path where binaries will be downloaded'
                             'Example: /home/user/folder_for_binaries',
                        required=True,
                        type=str)

    parser.add_argument('-t', '--targets',
                        help='One or more targets'
                             'Example: "gpu cpu python3.7"',
                        required=True,
                        type=str,
                        nargs='+',
                        choices=['gpu', 'cpu', 'vpu', 'hddl', 'opencv', 'python3.6', 'python3.7', 'python3.8'])

    parser.add_argument('--unpack',
                        help='Unpacks downloaded archives',
                        action='store_true',
                        default=False)
    return parser


class BundleDownloader:
    ARCHIVE_EXT = 'tar.gz'
    chunk_size = 1024 * 1024

    def __init__(self, link: str, os_types: str, output_path: str, targets: str, unpack: bool):
        self.link = link
        self.os_types = os_types
        self.output_path = output_path
        self.targets = targets
        self.unpack = unpack
        self.downloaded_percent = 0
        self.archives_amount = len(self.targets) * len(self.os_types)

    def download(self):
        for os_type in self.os_types:
            os_type_binaries_folder = os.path.join(self.output_path, os_type)
            os.makedirs(os_type_binaries_folder, exist_ok=True)

            for target_name in self.targets:
                self.download_package(os_type, target_name, os_type_binaries_folder)

    def download_package(self, os_type: str, target_name: str, os_type_binaries_folder: str):
        archive_name = f'{target_name}.{self.ARCHIVE_EXT}'
        package_url = os.path.join(self.link, os_type, archive_name)
        package_content = requests.get(package_url, stream=True)

        if package_content.status_code != 200:
            log.warning('Archive does not exists or page is not available now: \n\t%s', package_url)
            return

        if self.unpack:
            target_binaries_folder = os.path.join(os_type_binaries_folder, target_name)
        else:
            target_binaries_folder = os_type_binaries_folder
        os.makedirs(target_binaries_folder, exist_ok=True)

        binaries_package_path = os.path.join(target_binaries_folder, archive_name)

        with open(binaries_package_path, 'wb') as downloading_archive:
            total_file_size = int(package_content.headers.get('content-length'))

            for data_packet in package_content.iter_content(chunk_size=self.chunk_size):
                downloading_archive.write(data_packet)
                self.downloaded_percent += (100 / self.archives_amount) * len(data_packet) / total_file_size
                log.info('Total progress - %s', self.downloaded_percent)

        if self.unpack:
            shutil.unpack_archive(binaries_package_path, target_binaries_folder)
            os.remove(binaries_package_path)


if __name__ == '__main__':
    ARGS = build_argparser().parse_args()
    sys.exit(BundleDownloader(ARGS.link, ARGS.os, ARGS.output_path, ARGS.targets, ARGS.unpack).download())
