"""
 OpenVINO DL Workbench
 Class and functions for configuring index.html

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
import argparse
import os
import re
from typing import Optional

from lxml import etree, html
from lxml.etree import _ElementTree


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument('--index-html-path',
                        type=str,
                        required=True,
                        help='Path to index.html file.')
    parser.add_argument('--disable-analytics',
                        type=int,
                        nargs='?',
                        required=True,
                        help='Flag to disable analytics.')
    parser.add_argument('--base-prefix',
                        type=str,
                        nargs='?',
                        required=False,
                        default='/',
                        help='Base prefix of web application.')
    parser.add_argument('--analytics-id',
                        type=str,
                        nargs='?',
                        required=False,
                        help='Flag to disable analytics.')
    return parser.parse_args()


class HTMLFileEditor:
    def __init__(self, file_path: str):
        self._html_parser = etree.HTMLParser()
        self._file_path = file_path
        self._html_tree: _ElementTree = etree.parse(self._file_path, self._html_parser)

    @property
    def html_tree(self) -> _ElementTree:
        return self._html_tree

    def save(self):
        html_content = etree.tostring(self._html_tree.getroot(), pretty_print=True, method='html')
        with open(self._file_path, 'wb') as writer:
            writer.write(html_content)


def get_parent_element(html_file_path: str, tag: str):
    html_file_editor = HTMLFileEditor(file_path=html_file_path)
    html_tree = html_file_editor.html_tree
    body_element = html_tree.find(f'//{tag}')
    if body_element is None:
        raise Exception(f'No <{tag}> element found in HTML in path {html_file_path}')
    return html_file_editor, body_element


def add_analytics(html_file_path: str, google_analytics_id: str):
    html_file_editor, body_element = get_parent_element(html_file_path, 'body')
    script_element = html.Element('script')
    script_element.set('src', 'assets/js/track.js')
    script_element.set('type', 'text/javascript')
    script_element.tail = '\n    '
    body_element.insert(0, script_element)

    cdn_element = html.Element('script')
    cdn_element.set('async')
    cdn_element.set('type', 'text/javascript')
    cdn_element.set('src', f'https://www.googletagmanager.com/gtag/js?id={google_analytics_id}')
    cdn_element.tail = '\n    '
    body_element.insert(0, cdn_element)

    set_id_element = html.Element('script')
    set_id_element.set('type', 'text/javascript')
    set_id_element.set('src', 'assets/js/set_google_analytics_id.js')
    set_id_element.tail = '\n    '
    body_element.insert(0, set_id_element)
    html_file_editor.save()


def add_analytics_disable_script(html_file_path: str):
    html_file_editor, body_element = get_parent_element(html_file_path, 'body')
    script_element = etree.Element('script', type='text/javascript', src='assets/js/analytics-disable.js',
                                   id='analytics-disable-script')
    script_element.tail = '\n    '
    body_element.insert(0, script_element)

    html_file_editor.save()


def set_html_base_prefix(html_file_path: str, base_prefix: str):
    html_file_editor = HTMLFileEditor(file_path=html_file_path)
    html_tree = html_file_editor.html_tree

    base_tag = 'base'
    base_element = html_tree.find(f'//{base_tag}')
    if base_element is None:
        raise Exception(f'No <{base_tag}> element found in HTML in path {html_file_path}')

    base_prefix_pattern = re.compile(r'^\/(?:[\w-]+\/)*$')
    is_valid_base_prefix = base_prefix_pattern.match(base_prefix)
    if not is_valid_base_prefix:
        raise Exception(f'Invalid base prefix provided: {base_prefix}. It should start and end with "/" character.')
    base_element.attrib['href'] = base_prefix

    html_file_editor.save()


if __name__ == '__main__':
    ARGUMENTS = parse_arguments()
    index_html_file_path: str = ARGUMENTS.index_html_path
    disable_analytics: Optional[int] = ARGUMENTS.disable_analytics
    web_app_base_prefix: Optional[str] = ARGUMENTS.base_prefix
    analytics_id: str = ARGUMENTS.analytics_id

    if not os.path.exists(index_html_file_path):
        raise ValueError(f'No HTML file in found in path {index_html_file_path}')

    if analytics_id:
        add_analytics(index_html_file_path, analytics_id)
        if disable_analytics:
            add_analytics_disable_script(html_file_path=index_html_file_path)

    if not web_app_base_prefix:
        raise ValueError('Empty value provided for --base-prefix argument')
    set_html_base_prefix(html_file_path=index_html_file_path, base_prefix=web_app_base_prefix)
