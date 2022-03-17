"""
 OpenVINO DL Workbench
 Class for handling reports from benchmark application

 Copyright (c) 2018 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
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
        return int(self.get_value(self.configuration_setup, f'number of {self.configuration_setup_device} streams'))

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
    def get_value(table, name) -> float:
        for line in table:
            if name in line:
                pattern = r'\d*\.\d+|\d+'
                pattern = re.compile(pattern)
                matches = re.findall(pattern, line)
                if len(matches) == 1:
                    return float(matches[0])
                raise ValueError('Found more than one value for {}'.format(name))
        raise ValueError('Did not find a value for {}'.format(name))
