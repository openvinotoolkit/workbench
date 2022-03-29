"""
 OpenVINO DL Workbench
 Class for handling reports from benchmark application

 Copyright (c) 2018 Intel Corporation

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
import re
from typing import List


class BenchmarkReport:
    separator = ';'

    def __init__(self, path: str = ''):
        self.path_file = path
        try:
            with open(self.path_file) as csv_file:
                self.content = [line.strip() for line in csv_file]
        except OSError as error:
            raise error

        self.command_line_parameters = self.read_command_line_parameters()

        self.configuration_setup = self.read_configuration_setup()

        self.execution_results = self.read_execution_results()

    def find_index(self, table_name) -> int:
        for i, line in enumerate(self.content):
            if table_name in line:
                return i
        raise ValueError('Inconsistent benchmark app report')

    def read_table(self, head: str) -> List[str]:
        try:
            start_index = self.find_index(head)
        except ValueError:
            raise ValueError('Inconsistent benchmark app report does not contain {} table'.format(head))
        table = []
        for i in range(start_index + 1, len(self.content)):
            string = self.content[i]
            if not string:
                break
            table.append(string)
        return table

    def read_command_line_parameters(self) -> List[str]:
        head = 'Command line parameters'
        return self.read_table(head)

    def read_configuration_setup(self) -> List[str]:
        head = 'Configuration setup'
        return self.read_table(head)

    @property
    def device(self) -> str:
        for parameter in self.command_line_parameters:
            split_line = parameter.split(self.separator)
            name = split_line[0]
            value = split_line[1]
            if name == 'd' or 'target device' in name:
                return value
        raise ValueError('Inconsistent benchmark app report')

    def read_execution_results(self) -> List[str]:
        head = 'Execution results'
        return self.read_table(head)

    @property
    def configuration_setup_device(self) -> str:
        for line in self.configuration_setup:
            name, value = line.split(self.separator)
            if name == 'target device':
                return value
        raise ValueError('Inconsistent benchmark app report')

    @property
    def batch(self) -> int:
        return int(self.get_value(self.configuration_setup, 'batch size'))

    @property
    def streams(self) -> int:
        device = self.configuration_setup_device
        name = f'number of {device} streams'
        if 'MYRIAD' in name or name == 'HDDL':
            name = 'number of parallel infer requests'
        return int(self.get_value(self.configuration_setup, name))

    @property
    def latency(self) -> float:
        return self.get_value(self.execution_results, 'latency')

    @property
    def throughput(self) -> float:
        return self.get_value(self.execution_results, 'throughput')

    @property
    def total_exec_time(self) -> float:
        return self.get_value(self.execution_results, 'total execution time')

    @staticmethod
    def get_value(table, name: str) -> float:
        for line in table:
            if name in line:
                pattern = r'\d*\.\d+|\d+'
                pattern = re.compile(pattern)
                matches = re.findall(pattern, line)
                if len(matches) == 1:
                    return float(matches[0])
                raise ValueError('Found more than one value for {}'.format(name))
        raise ValueError('Did not find a value for {}'.format(name))
