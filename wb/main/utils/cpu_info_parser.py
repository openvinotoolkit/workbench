"""
 OpenVINO DL Workbench
 Class for getting and parsing machine CPU information

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
import re
from typing import Match, Optional

import cpuinfo
import psutil
from typing_extensions import TypedDict

from wb.main.enumerates import CPUPlatformTypeEnum


class ParsedCPUInfo(TypedDict):
    name: str
    platform: Optional[CPUPlatformTypeEnum]
    processor_family: Optional[str]
    processor_number: Optional[str]


class CPUInfoParser:
    _frequency_units = 'GHz'
    _mhz_in_ghz = 1000

    _copyright_mark_pattern = r'(?:\((TM|R)\))'
    _quad_duo_prefix_pattern = re.compile(r'(?:2\s*(Quad|Duo))')


    _cpu_name_escaped_pattern = re.compile(r'(?:cpu|processor)\s?', flags=re.RegexFlag.IGNORECASE)
    _cpu_gen_pattern = r'(?:\d+th Gen)'
    _cpu_platform_pattern = \
        fr'(Intel\s*{_copyright_mark_pattern}?\s*(?P<cpu_platform>Core|Xeon|Atom|Celeron)\s*{_copyright_mark_pattern}?)'
    _cpu_number_pattern = r'(?P<cpu_number>[\sA-Za-z0-9-_()]+)'
    _cpu_suffix_pattern = r'(?:@\s?(?:\d+\.)?\d+\s?[GM]?Hz)'
    _cpu_full_name_pattern = re.compile(
        rf'(?:{_cpu_gen_pattern}?\s*{_cpu_platform_pattern}\s*{_cpu_number_pattern}?\s*{_cpu_suffix_pattern}?)')

    _processor_family_pattern = re.compile(rf'((?P<processor_family>.+)\s{_cpu_suffix_pattern})')
    _intel_core_processor_number_pattern = re.compile(
        r'(?P<core_family>i([3579]))\s?-\s?((?P<core_generation>1\d|[2-9])\d{2,}.+)'
    )

    @staticmethod
    def get_cpu_full_name() -> str:
        return cpuinfo.get_cpu_info()['brand_raw']

    @staticmethod
    def get_cpu_cores_number() -> int:
        return psutil.cpu_count(logical=False)

    @classmethod
    def get_cpu_frequency(cls) -> Optional[str]:
        cpu_frequency = psutil.cpu_freq(percpu=False)
        if cpu_frequency.min == cpu_frequency.max:
            if not cpu_frequency.min:
                return None
            return '{:.1f} {units}'.format(cpu_frequency.min / cls._mhz_in_ghz, units=cls._frequency_units)
        return '{:.1f}-{:.1f} {units}'.format(cpu_frequency.min / cls._mhz_in_ghz, cpu_frequency.max / cls._mhz_in_ghz,
                                              units=cls._frequency_units)

    @staticmethod
    def _parse_processor_number(processor_number: str) -> str:
        matter_processor_number = CPUInfoParser._quad_duo_prefix_pattern.sub(repl='', string=processor_number)
        clear_processor_number = matter_processor_number.replace(' ', '')
        return clear_processor_number

    @staticmethod
    def _parse_intel_core_family(processor_number: str) -> Optional[str]:
        processor_family_template = 'Intel(R) Core(TM) {core_family} Processor'
        if 'Quad' in processor_number:
            return processor_family_template.format(core_family='Quad')
        if 'Duo' in processor_number:
            return processor_family_template.format(core_family='Duo')
        intel_core_processor_number_match: Match = (
            CPUInfoParser._intel_core_processor_number_pattern.search(processor_number)
        )
        if not intel_core_processor_number_match:
            return None
        core_family = intel_core_processor_number_match.group('core_family')
        core_generation = intel_core_processor_number_match.group('core_generation')

        def ordinal(num: int) -> str:
            if 10 <= num % 100 <= 20:
                suffix = 'th'
            else:
                suffix = {1: 'st', 2: 'nd', 3: 'rd'}.get(num % 10, 'th')
            return f'{num}{suffix}'

        return f'{ordinal(int(core_generation))} Generation {processor_family_template.format(core_family=core_family)}'

    @staticmethod
    def _parse_processor_family(cpu_full_name: str) -> str:
        processor_family_match: Match = CPUInfoParser._processor_family_pattern.search(cpu_full_name)
        if not processor_family_match:
            return cpu_full_name
        return processor_family_match.group('processor_family')

    @staticmethod
    def parse_cpu_full_name(cpu_full_name: str) -> ParsedCPUInfo:
        escaped_cpu_name = CPUInfoParser._cpu_name_escaped_pattern.sub(repl='', string=cpu_full_name)
        match: Match = CPUInfoParser._cpu_full_name_pattern.match(escaped_cpu_name)
        if not match:
            return ParsedCPUInfo(name=cpu_full_name,
                                 platform=CPUPlatformTypeEnum.not_recognized,
                                 processor_family=None,
                                 processor_number=None)
        cpu_platform = match.group('cpu_platform')
        cpu_platform = CPUPlatformTypeEnum(cpu_platform.lower())
        processor_number = match.group('cpu_number')
        if cpu_platform == CPUPlatformTypeEnum.core:
            processor_family = CPUInfoParser._parse_intel_core_family(processor_number=processor_number)
        else:
            processor_family = CPUInfoParser._parse_processor_family(cpu_full_name=escaped_cpu_name)
        processor_number = CPUInfoParser._parse_processor_number(processor_number)
        return ParsedCPUInfo(name=cpu_full_name,
                             platform=cpu_platform,
                             processor_family=processor_family,
                             processor_number=processor_number)
