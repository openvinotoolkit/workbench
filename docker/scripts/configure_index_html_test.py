"""
Tests for configure_index_html.py script
"""
import os

import pytest

HTML_FILE_CONTENT = """\
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>DL Workbench</title>
    <base href="/">

    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/x-icon" href="favicon.ico">
    <link rel="stylesheet" href="assets/netron/view-grapher.css">
    <link rel="stylesheet" href="assets/netron/view-sidebar.css">
  </head>
  <body>
    <wb-root class="wb-body-4"></wb-root>
    <div id="menu-button"></div>
  </body>
</html>
"""

DISABLE_ANALYTICS_SCRIPT_ELEMENT = '<script type="text/javascript" ' \
                                   'src="assets/js/analytics-disable.js" id="analytics-disable-script">'
BASE_ELEMENT_WITHOUT_PREFIX = '<base href="/">'
TEST_BASE_PREFIX = '/test/base/prefix/'
BASE_ELEMENT_WITH_PREFIX = f'<base href="{TEST_BASE_PREFIX}">'
TEST_GA_ID = 'TEST-ID'
GOOGLE_ANALYTICS_SCRIPT = f'<script async type="text/javascript" src="https://www.googletagmanager.com/gtag/js?id={TEST_GA_ID}"></script>'
TRACK_SCRIPT = '<script src="assets/js/track.js" type="text/javascript"></script>'
GA_ID_SCRIPT = '<script type="text/javascript" src="assets/js/set_google_analytics_id.js"></script>'


class TestConfigureIndexHtmlScript:
    """
    Example of running the script:
        configure_index_html.py \
          --index-html-path ${OPENVINO_WORKBENCH_ROOT}/static/index.html \
          --disable-analytics ${DISABLE_ANALYTICS} \
          --base-prefix ${BASE_PREFIX}
    """
    _current_dir = os.path.dirname(os.path.abspath(__file__))
    _script_path = os.path.join(_current_dir, 'configure_index_html.py')
    _base_script_command = f'python3 {_script_path}'
    _index_html_path_param_name = '--index-html-path'
    _disable_analytics_param_name = '--disable-analytics'
    _base_prefix_param_name = '--base-prefix'
    _analytics_id_param = '--analytics-id'

    _success_return_code = 0

    @staticmethod
    def _initialize_html(html_file_path: str):
        if os.path.exists(html_file_path):
            os.remove(html_file_path)
        with open(html_file_path, 'w') as html_file:
            html_file.write(HTML_FILE_CONTENT)

    @pytest.fixture(scope='function')
    def initial_html_file(self, tmp_path: str) -> str:
        html_file_path = os.path.join(tmp_path, 'index.html')
        self._initialize_html(html_file_path)
        return html_file_path

    def test_script_without_params(self, initial_html_file: str):
        commands = (
            f'{self._base_script_command}',
            f'{self._base_script_command} {self._index_html_path_param_name}',
            f'{self._get_command_with_html_path(initial_html_file)}',
        )

        for command in commands:
            return_code = os.system(command)
            assert return_code != self._success_return_code
            assert self._get_html_file_content(initial_html_file) == HTML_FILE_CONTENT

    def test_disable_analytics_param_empty(self, initial_html_file: str):
        command = f'{self._get_command_with_html_path(initial_html_file)} {self._disable_analytics_param_name}'
        return_code = os.system(command)
        assert return_code == self._success_return_code
        assert self._get_html_file_content(initial_html_file) == HTML_FILE_CONTENT
        assert DISABLE_ANALYTICS_SCRIPT_ELEMENT not in self._get_html_file_content(initial_html_file)

    def test_disable_analytics_param_invalid(self, initial_html_file: str):
        command = f'{self._get_command_with_html_path(initial_html_file)} {self._disable_analytics_param_name} asd'
        return_code = os.system(command)
        assert return_code != self._success_return_code
        assert self._get_html_file_content(initial_html_file) == HTML_FILE_CONTENT
        assert DISABLE_ANALYTICS_SCRIPT_ELEMENT not in self._get_html_file_content(initial_html_file)

    def test_disable_analytics_param_disabled(self, initial_html_file: str):
        command = f'{self._get_command_with_html_path(initial_html_file)} {self._disable_analytics_param_name} 0'
        return_code = os.system(command)
        assert return_code == self._success_return_code
        assert self._get_html_file_content(initial_html_file) == HTML_FILE_CONTENT
        assert DISABLE_ANALYTICS_SCRIPT_ELEMENT not in self._get_html_file_content(initial_html_file)

    def test_disable_analytics_param_enabled(self, initial_html_file: str):
        command = f'{self._get_command_with_html_path(initial_html_file)} {self._disable_analytics_param_name} 1 ' \
                  f'{self._analytics_id_param} {TEST_GA_ID}'
        return_code = os.system(command)
        assert return_code == self._success_return_code
        assert self._get_html_file_content(initial_html_file) != HTML_FILE_CONTENT
        assert DISABLE_ANALYTICS_SCRIPT_ELEMENT in self._get_html_file_content(initial_html_file)

    def _check_invalid_base_prefix_param(self, initial_html_file: str, base_prefix: str):
        command = f'{self._get_command_with_html_path(initial_html_file)} ' \
                  f'{self._disable_analytics_param_name} 0 ' \
                  f'{self._base_prefix_param_name} {base_prefix}'
        return_code = os.system(command)
        assert return_code != self._success_return_code
        assert self._get_html_file_content(initial_html_file) == HTML_FILE_CONTENT
        assert BASE_ELEMENT_WITH_PREFIX not in self._get_html_file_content(initial_html_file)

    def test_base_prefix_param_invalid(self, initial_html_file: str):
        invalid_base_prefixes = (
            '', 'invalid_prefix', 'prefix/without/leading/slash/', '/prefix/without/trailing/slash',
            '///several/slashes/', '/several//slashes/', '/several/slashes//', '"/some/normal/with space/"',
            '/with/special/symbol/$/')
        for prefix in invalid_base_prefixes:
            self._check_invalid_base_prefix_param(initial_html_file=initial_html_file, base_prefix=prefix)

    def test_base_prefix_param_set(self, initial_html_file: str):
        command = f'{self._get_command_with_html_path(initial_html_file)} ' \
                  f'{self._disable_analytics_param_name} 0 ' \
                  f'{self._base_prefix_param_name} {TEST_BASE_PREFIX}'
        return_code = os.system(command)
        assert return_code == self._success_return_code
        assert self._get_html_file_content(initial_html_file) != HTML_FILE_CONTENT
        assert BASE_ELEMENT_WITH_PREFIX in self._get_html_file_content(initial_html_file)

    def test_ga_script_present(self, initial_html_file: str):
        command = f'{self._get_command_with_html_path(initial_html_file)} ' \
                  f'{self._disable_analytics_param_name} 0 ' \
                  f'{self._analytics_id_param} {TEST_GA_ID}'
        return_code = os.system(command)
        assert return_code == self._success_return_code
        assert self._get_html_file_content(initial_html_file) != HTML_FILE_CONTENT
        assert GOOGLE_ANALYTICS_SCRIPT in self._get_html_file_content(initial_html_file)
        assert TRACK_SCRIPT in self._get_html_file_content(initial_html_file)
        assert GA_ID_SCRIPT in self._get_html_file_content(initial_html_file)

    @staticmethod
    def _get_html_file_content(html_file_path: str) -> str:
        with open(html_file_path, 'r') as html_file:
            html_file_content = html_file.read()
        return html_file_content

    def _get_command_with_html_path(self, html_file_path: str) -> str:
        return f'{self._base_script_command} {self._index_html_path_param_name} {html_file_path}'
