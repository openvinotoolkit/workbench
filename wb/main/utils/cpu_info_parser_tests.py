"""
 OpenVINO DL Workbench
 Tests for Class for getting and parsing machine CPU information

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

import pytest

from wb.main.enumerates import CPUPlatformTypeEnum
from wb.main.utils.cpu_info_parser import CPUInfoParser, ParsedCPUInfo


class TestCPUInfoParser:
    full_cpu_name_to_expected_parsed_value = [
        # Cores
        (
            '11th Gen Intel(R) Core(TM) i7-1185G7E @ 2.80GHz',  # full_cpu_name
            ParsedCPUInfo(name='11th Gen Intel(R) Core(TM) i7-1185G7E @ 2.80GHz',  # expected
                          platform=CPUPlatformTypeEnum.core,
                          processor_family='11th Generation Intel(R) Core(TM) i7 Processor',
                          processor_number='i7-1185G7E')
        ),
        (
            'Intel(R) Core(TM) i7 - 6770HQ CPU @ 2.60GHz',  # full_cpu_name
            ParsedCPUInfo(name='Intel(R) Core(TM) i7 - 6770HQ CPU @ 2.60GHz',  # expected
                          platform=CPUPlatformTypeEnum.core,
                          processor_family='6th Generation Intel(R) Core(TM) i7 Processor',
                          processor_number='i7-6770HQ')
        ),
        (
            'Intel(R) Core(TM) i5-4210U CPU @ 1.70GHz',  # full_cpu_name
            ParsedCPUInfo(name='Intel(R) Core(TM) i5-4210U CPU @ 1.70GHz',  # expected
                          platform=CPUPlatformTypeEnum.core,
                          processor_family='4th Generation Intel(R) Core(TM) i5 Processor',
                          processor_number='i5-4210U')
        ),
        (
            'Intel(R) Core(TM) i9-9900K CPU @ 3.60GHz',  # full_cpu_name
            ParsedCPUInfo(name='Intel(R) Core(TM) i9-9900K CPU @ 3.60GHz',  # expected
                          platform=CPUPlatformTypeEnum.core,
                          processor_family='9th Generation Intel(R) Core(TM) i9 Processor',
                          processor_number='i9-9900K')
        ),
        (
            'Intel(R) Core(TM) i3-2120 CPU @ 3.30GHz',  # full_cpu_name
            ParsedCPUInfo(name='Intel(R) Core(TM) i3-2120 CPU @ 3.30GHz',  # expected
                          platform=CPUPlatformTypeEnum.core,
                          processor_family='2nd Generation Intel(R) Core(TM) i3 Processor',
                          processor_number='i3-2120')
        ),
        (
            'Intel(R) Core(TM) i5-6500TE CPU @ 2.30GHz',  # full_cpu_name
            ParsedCPUInfo(name='Intel(R) Core(TM) i5-6500TE CPU @ 2.30GHz',  # expected
                          platform=CPUPlatformTypeEnum.core,
                          processor_family='6th Generation Intel(R) Core(TM) i5 Processor',
                          processor_number='i5-6500TE')
        ),
        (
            'Intel(R) Core(TM) i5-8365UE CPU @ 1.60GHz',  # full_cpu_name
            ParsedCPUInfo(name='Intel(R) Core(TM) i5-8365UE CPU @ 1.60GHz',  # expected
                          platform=CPUPlatformTypeEnum.core,
                          processor_family='8th Generation Intel(R) Core(TM) i5 Processor',
                          processor_number='i5-8365UE')
        ),
        (
            'Intel(R) Core(TM) i7-1065G7 CPU @ 1.30GHz',  # full_cpu_name
            ParsedCPUInfo(name='Intel(R) Core(TM) i7-1065G7 CPU @ 1.30GHz',  # expected
                          platform=CPUPlatformTypeEnum.core,
                          processor_family='10th Generation Intel(R) Core(TM) i7 Processor',
                          processor_number='i7-1065G7')
        ),
        # Core Quad
        (
            'Intel(R) Core(TM)2 Quad CPU Q9400 @ 2.66GHz',  # full_cpu_name
            ParsedCPUInfo(name='Intel(R) Core(TM)2 Quad CPU Q9400 @ 2.66GHz',  # expected
                          platform=CPUPlatformTypeEnum.core,
                          processor_family='Intel(R) Core(TM) Quad Processor',
                          processor_number='Q9400')
        ),
        # Core Duo
        (
            'Intel(R) Core(TM)2 Duo CPU T6500 @ 2.10GHz',  # full_cpu_name
            ParsedCPUInfo(name='Intel(R) Core(TM)2 Duo CPU T6500 @ 2.10GHz',  # expected
                          platform=CPUPlatformTypeEnum.core,
                          processor_family='Intel(R) Core(TM) Duo Processor',
                          processor_number='T6500')
        ),
        # Atom
        (
            'Intel(R) Atom(TM) Processor E3950 @ 1.60GHz',  # full_cpu_name
            ParsedCPUInfo(name='Intel(R) Atom(TM) Processor E3950 @ 1.60GHz',  # expected
                          platform=CPUPlatformTypeEnum.atom,
                          processor_family='Intel(R) Atom(TM) E3950',
                          processor_number='E3950')
        ),
        (
            'Intel(R) Atom(TM) Processor E3940 @ 1.60GHz',  # full_cpu_name
            ParsedCPUInfo(name='Intel(R) Atom(TM) Processor E3940 @ 1.60GHz',  # expected
                          platform=CPUPlatformTypeEnum.atom,
                          processor_family='Intel(R) Atom(TM) E3940',
                          processor_number='E3940')
        ),
        (
            'Intel(R) Celeron(R) CPU J3355 @ 2.00GHz',  # full_cpu_name
            ParsedCPUInfo(name='Intel(R) Celeron(R) CPU J3355 @ 2.00GHz',  # expected
                          platform=CPUPlatformTypeEnum.celeron,
                          processor_family='Intel(R) Celeron(R) J3355',
                          processor_number='J3355')
        ),
        # Xeon
        (
            'Intel(R) Xeon(R) CPU E5-2620 v4 @ 2.10GHz',  # full_cpu_name
            ParsedCPUInfo(name='Intel(R) Xeon(R) CPU E5-2620 v4 @ 2.10GHz',  # expected
                          platform=CPUPlatformTypeEnum.xeon,
                          processor_family='Intel(R) Xeon(R) E5-2620 v4',
                          processor_number='E5-2620v4')
        ),
        (
            'Intel(R) Xeon(R) CPU E5-2620 0 @ 2.00GHz',  # full_cpu_name
            ParsedCPUInfo(name='Intel(R) Xeon(R) CPU E5-2620 0 @ 2.00GHz',  # expected
                          platform=CPUPlatformTypeEnum.xeon,
                          processor_family='Intel(R) Xeon(R) E5-2620 0',
                          processor_number='E5-26200')
        ),
        (
            'Intel(R) Xeon(R) Gold 5220R CPU @ 2.20GHz',  # full_cpu_name
            ParsedCPUInfo(name='Intel(R) Xeon(R) Gold 5220R CPU @ 2.20GHz',  # expected
                          platform=CPUPlatformTypeEnum.xeon,
                          processor_family='Intel(R) Xeon(R) Gold 5220R',
                          processor_number='Gold5220R')
        ),
        (
            'Intel(R) Xeon(R) Gold 5120 CPU @ 2.20GHz',  # full_cpu_name
            ParsedCPUInfo(name='Intel(R) Xeon(R) Gold 5120 CPU @ 2.20GHz',  # expected
                          platform=CPUPlatformTypeEnum.xeon,
                          processor_family='Intel(R) Xeon(R) Gold 5120',
                          processor_number='Gold5120')
        ),
        (
            'Intel(R) Xeon(R) Silver 4214R CPU @ 2.40GHz',
            ParsedCPUInfo(name='Intel(R) Xeon(R) Silver 4214R CPU @ 2.40GHz',  # expected
                          platform=CPUPlatformTypeEnum.xeon,
                          processor_family='Intel(R) Xeon(R) Silver 4214R',
                          processor_number='Silver4214R')
        ),
        (
            'Intel(R) Xeon(R) Bronze 3206R CPU @ 1.90GHz',  # expected
            ParsedCPUInfo(name='Intel(R) Xeon(R) Bronze 3206R CPU @ 1.90GHz',  # expected
                          platform=CPUPlatformTypeEnum.xeon,
                          processor_family='Intel(R) Xeon(R) Bronze 3206R',
                          processor_number='Bronze3206R')
        ),
        (
            'Intel(R) Xeon(R) E-2286M CPU @ 2.40GHz',  # expected
            ParsedCPUInfo(name='Intel(R) Xeon(R) E-2286M CPU @ 2.40GHz',  # expected
                          platform=CPUPlatformTypeEnum.xeon,
                          processor_family='Intel(R) Xeon(R) E-2286M',
                          processor_number='E-2286M')
        ),
        # Not recognized
        (
            'AMD Ryzen 7 1700 Eight-Core Processor',  # full_cpu_name
            ParsedCPUInfo(name='AMD Ryzen 7 1700 Eight-Core Processor',  # expected
                          platform=CPUPlatformTypeEnum.not_recognized,
                          processor_family=None,
                          processor_number=None)
        ),
        (
            'AMD FX(tm)-8350 Eight-Core Processor',  # full_cpu_name
            ParsedCPUInfo(name='AMD FX(tm)-8350 Eight-Core Processor',  # expected
                          platform=CPUPlatformTypeEnum.not_recognized,
                          processor_family=None,
                          processor_number=None)
        ),
    ]

    @staticmethod
    def compare_parsed_cpu_info(actual: ParsedCPUInfo, expected: ParsedCPUInfo):
        for key in expected.keys():
            assert actual[key] == expected[key]  # nosec: assert_used

    @pytest.mark.parametrize('full_cpu_name,expected', full_cpu_name_to_expected_parsed_value)
    def test_parse_full_cpu_name(self, full_cpu_name: str, expected: ParsedCPUInfo):
        actual = CPUInfoParser.parse_cpu_full_name(full_cpu_name)
        self.compare_parsed_cpu_info(actual=actual, expected=expected)
