"""
 OpenVINO DL Workbench
 File for downloading OpenVINO Runtime and Dev wheels

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

import logging as log
import os
import sys
from argparse import ArgumentParser
from typing import List
from urllib.parse import urljoin, urlparse, urlsplit

import requests
from lxml.html import fromstring


def build_argparser():
    log.basicConfig(format='[ %(levelname)s ] %(message)s', level=log.INFO, stream=sys.stdout)
    parser = ArgumentParser()

    parser.add_argument('-l', '--link',
                        help='Link to the folder with wheels',
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
        self.base_url = self._get_base_url()
        self.wheel_links = self._get_wheels_urls()
        self.wheels_number = len(self.wheel_links)

    def _get_base_url(self) -> str:
        parsed_url = urlsplit(self.link)
        return f'{parsed_url.scheme}://{parsed_url.netloc}'

    def _get_wheels_urls(self) -> List[str]:
        links = []
        wheels_page = requests.get(self.link).text
        parsed_page = fromstring(wheels_page)
        for link_object in parsed_page.iterlinks():
            # link object consists of (element, 'href', link)
            link = link_object[2]

            # get only wheels
            if '.whl' in link:
                # link is relative to the base url
                links.append(urljoin(self.base_url, link))
        return links

    def download(self):
        os.makedirs(self.output_path, exist_ok=True)
        for wheel_link in self.wheel_links:
            self._download_wheel(wheel_link)

    def _download_wheel(self, wheel_link: str):
        wheel_name = os.path.basename(urlparse(wheel_link).path)
        wheel_path = os.path.join(self.output_path, wheel_name)
        link_content = requests.get(wheel_link, stream=True)

        if link_content.status_code != 200:
            log.warning(f'Wheel at link {wheel_link} does not exist or the link is not available.')
            return

        with open(wheel_path, 'wb') as wheel_file:
            total_file_size = int(link_content.headers.get('content-length'))

            for data_packet in link_content.iter_content(chunk_size=self.chunk_size):
                wheel_file.write(data_packet)
                self.downloaded_percent += (100 / self.wheels_number) * len(data_packet) / total_file_size
                log.info('Total progress - %s', self.downloaded_percent)


if __name__ == '__main__':
    ARGS = build_argparser().parse_args()
    sys.exit(WheelsDownloader(ARGS.link, ARGS.output_path).download())
