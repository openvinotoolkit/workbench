"""
 OpenVINO DL Workbench
 Classes for parsing and formatting CLI tool help message

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
import enum
import json
import re
import subprocess  # nosec: blacklist
from multiprocessing import Process, Manager
from pathlib import Path
from typing import List, Optional, Set, Dict, Pattern, Match

from typing_extensions import TypedDict

from config.constants import DATA_FOLDER, INTEL_OPENVINO_DIR
from wb.main.models.wb_information_model import WBInfoModel


class CLIToolOption(TypedDict):
    name: str
    help_description: str


class CLIToolOptionsParser:
    _default_executable = 'python3'

    _section_title_pattern: Pattern = re.compile(r'.+:\n')
    _section_indent_pattern: Pattern = re.compile(r'\n\n')
    _option_pattern: Pattern = re.compile(r' {2}--?\w+')
    _option_name_pattern: Pattern = re.compile(r'(--?[\w-]+)')
    _option_blocks_indent_pattern: Pattern = re.compile(r' {2,}')
    _option_blocks_delimiter_pattern: Pattern = re.compile(r' {2}(?=-)')

    def __init__(self, relative_tool_path: str):
        self._tool_path = Path(relative_tool_path)
        self._is_relative_tool = not self._tool_path.is_absolute() and \
                                 len(self._tool_path.parts) > 1 and self._tool_path.suffix
        if self._is_relative_tool:
            if not INTEL_OPENVINO_DIR:
                raise Exception('Error with environment: INTEL_OPENVINO_DIR is not set')
            self._tool_path = Path(INTEL_OPENVINO_DIR) / relative_tool_path

    @property
    def _help_command(self) -> str:
        tool_help_subcommand = f'{self._tool_path} --help'
        if not self._is_relative_tool:
            return tool_help_subcommand
        return f'{self._default_executable} {tool_help_subcommand}'

    @property
    def _help_command_output(self) -> str:
        command_result = subprocess.run(self._help_command.split(),  # nosec: subprocess_without_shell_equals_true
                                        stdout=subprocess.PIPE)
        if command_result.returncode:
            raise Exception(f'Invalid help command: {self._help_command}')
        return command_result.stdout.decode('utf-8')

    @property
    def _help_command_sections(self) -> List[str]:
        help_command_output = self._help_command_output
        return re.split(self._section_indent_pattern, help_command_output)

    @property
    def _help_command_options_content(self) -> str:
        sections_with_options = []
        for section in self._help_command_sections:
            section_title_match = re.match(self._section_title_pattern, section)
            option_match = re.search(self._option_pattern, section)
            if section_title_match and option_match:
                section_without_title = section.split(':\n', maxsplit=1)[1]
                sections_with_options.append(section_without_title)
        return '\n'.join(sections_with_options)

    @staticmethod
    def _parse_option_name(option_output: str) -> Optional[str]:
        option_name_match: Match = CLIToolOptionsParser._option_name_pattern.search(option_output)
        return option_name_match.group(0) if option_name_match else None

    @staticmethod
    def _parse_option_description(option_output: str) -> Optional[str]:
        option_blocks_indent_pattern = CLIToolOptionsParser._option_blocks_indent_pattern
        option_output_blocks = re.split(option_blocks_indent_pattern, option_output, maxsplit=1)
        if len(option_output_blocks) == 1:
            return None
        _, option_description = option_output_blocks
        formatted_option_description = re.sub(option_blocks_indent_pattern, ' ', option_description).replace('\n', '')
        return formatted_option_description

    @property
    def options(self) -> List[CLIToolOption]:
        options = []
        for option_output in re.split(self._option_blocks_delimiter_pattern, self._help_command_options_content):
            if not option_output:
                continue
            option_name = self._parse_option_name(option_output)
            if not option_name:
                raise Exception(f'Unable to parse option name from output:\n{option_output}')
            option_description = self._parse_option_description(option_output)
            if option_name and option_description:
                option = CLIToolOption(name=option_name, help_description=option_description)
                options.append(option)
        return options


class CLIToolHelpToMarkdownTableFormatter:
    _markdown_table_header = 'Argument | Explanation\n' \
                             ':-- | :--\n'

    @staticmethod
    def format(cli_tool: 'CLIToolEnum') -> str:
        cli_tool_name = cli_tool.name
        result = CLIToolHelpToMarkdownTableFormatter._markdown_table_header
        displayed_options_set: Set = cli_tool.value.get('displayed_options', set())
        tool_options = CLIToolsOptionsCache().get_tool_options(tool_name=cli_tool_name)
        for option in tool_options:
            if option['name'] in displayed_options_set or not displayed_options_set:
                escaped_help_description = option['help_description'].replace('|', '\\|')
                option_line = f'`{option["name"]}` | {escaped_help_description}\n'
                result += option_line
        return result


class CLITool(TypedDict):
    path: str
    displayed_options: Set[str]


class CLIToolEnum(enum.Enum):
    model_downloader = CLITool(path='omz_downloader',
                               displayed_options={'--name', '-o', '--print_all'})
    model_converter = CLITool(path='omz_converter',
                              displayed_options={'--name', '-d', '-o'})
    model_optimizer = CLITool(path='mo',
                              displayed_options=set())
    benchmark_tool = CLITool(path='benchmark_app',
                             displayed_options={'-m', '-i', '-d', '-b', '-nstreams', '-t'})
    accuracy_checker = CLITool(path='accuracy_check',
                               displayed_options={'-c', '-m', '-s'})
    pot = CLITool(path='pot',
                  displayed_options={'-c', '--output-dir', '--direct-dump'})

    transformers_onnx = CLITool(path='python -m transformers.onnx',
                                displayed_options=set())

    def format_to_markdown_table(self) -> str:
        return CLIToolHelpToMarkdownTableFormatter.format(cli_tool=self)

    @classmethod
    def values(cls) -> List[CLITool]:
        return [item.value for item in cls]

    @classmethod
    def keys(cls) -> List[CLITool]:
        return [item.name for item in cls]


class CLIToolsOptionsCache:
    _options_map: Dict[str, Optional[List[CLIToolOption]]]

    def __new__(cls):
        if not hasattr(cls, 'instance'):
            cls.instance = super(CLIToolsOptionsCache, cls).__new__(cls)
        return cls.instance

    @staticmethod
    def _get_wb_version() -> str:
        return WBInfoModel.get_version_from_file()

    @staticmethod
    def _update_parsed_tool_options_map(tool_name: str, tool_path: str, tool_options_map: Dict):
        tool_options_map[tool_name] = CLIToolOptionsParser(tool_path).options

    def initialize(self):
        current_wb_version = self._get_wb_version()
        if CLIToolsOptionsDumper.dump_file_path.exists():
            dump_data = CLIToolsOptionsDumper.deserialize()
            tool_options_map = dump_data.get('options_map')
            dumped_wb_version = dump_data.get('wb_version')
            new_tools = {tool.name for tool in CLIToolEnum} - set(tool_options_map)
            if (
                current_wb_version == dumped_wb_version
                and tool_options_map
                and all(value in CLIToolEnum.keys() for value in tool_options_map)
                and not new_tools
            ):
                self._options_map = tool_options_map
                return
        tool_processes = []
        processes_tool_options_map = Manager().dict()
        for tool_enum in CLIToolEnum:
            tool_name = tool_enum.name
            tool_path = tool_enum.value['path']
            process = Process(target=self._update_parsed_tool_options_map,
                              args=(tool_name, tool_path, processes_tool_options_map))
            tool_processes.append(process)
            process.start()
        for process in tool_processes:
            process.join()
        CLIToolsOptionsDumper.serialize(options_map=processes_tool_options_map.copy(),
                                        wb_version=current_wb_version)
        self._options_map = processes_tool_options_map

    def get_tool_options(self, tool_name: str) -> List[CLIToolOption]:
        if tool_name not in set(item.name for item in CLIToolEnum):
            raise Exception(f'Error while getting tool options: unknown tool name {tool_name}')
        tool_options = self._options_map.get(tool_name)
        if not tool_options:
            raise Exception(f'Error while getting tool options: options is not parsed for tool {tool_name}')
        return tool_options


class CLIOptionsDumpData(TypedDict):
    wb_version: str
    options_map: Dict[str, List[CLIToolOption]]


class CLIToolsOptionsDumper:
    dump_file_path = Path(DATA_FOLDER) / 'cli_tools_options.json'

    @staticmethod
    def _is_valid_dump_data(dump_data: CLIOptionsDumpData) -> bool:
        wb_version = dump_data.get('wb_version')
        options_map = dump_data.get('options_map')
        return isinstance(wb_version, str) and isinstance(options_map, dict)

    @staticmethod
    def serialize(options_map: Dict[str, List[CLIToolOption]], wb_version: str):
        CLIToolsOptionsDumper.dump_file_path.touch(exist_ok=True)
        dump_data = CLIOptionsDumpData(wb_version=wb_version, options_map=options_map)
        with CLIToolsOptionsDumper.dump_file_path.open('w') as options_dump_file:
            json.dump(dump_data, options_dump_file)

    @staticmethod
    def deserialize() -> CLIOptionsDumpData:
        CLIToolsOptionsDumper.dump_file_path.touch(exist_ok=True)
        empty_dump_data = CLIOptionsDumpData(wb_version='', options_map={})
        with CLIToolsOptionsDumper.dump_file_path.open() as options_dump_file:
            try:
                dump_data: CLIOptionsDumpData = json.load(options_dump_file)
                if not CLIToolsOptionsDumper._is_valid_dump_data(dump_data):
                    dump_data = empty_dump_data
            except json.decoder.JSONDecodeError:
                dump_data = empty_dump_data
        return dump_data
