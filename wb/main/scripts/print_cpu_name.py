"""
 OpenVINO DL Workbench
 Script to check internet connection

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
from cpuinfo import get_cpu_info
from psutil import cpu_count, cpu_freq

if __name__ == '__main__':
    FULL_CPU_NAME = get_cpu_info()['brand_raw']
    print(f'Full CPU name is {FULL_CPU_NAME}')
    print(f'CPU cores number: {cpu_count(logical=False)}')
    CPU_FREQUENCY_RANGE = cpu_freq(percpu=False)
    CPU_FREQUENCY_UNITS = 'GHz'
    MHZ_IN_GHZ = 1000
    if CPU_FREQUENCY_RANGE.min == CPU_FREQUENCY_RANGE.max:
        CPU_FREQUENCY = '{:.1f} {units}'.format(CPU_FREQUENCY_RANGE.min / MHZ_IN_GHZ, units=CPU_FREQUENCY_UNITS)
    else:
        CPU_FREQUENCY = '{:.1f}-{:.1f} {units}'.format(CPU_FREQUENCY_RANGE.min / MHZ_IN_GHZ,
                                                       CPU_FREQUENCY_RANGE.max / MHZ_IN_GHZ, units=CPU_FREQUENCY_UNITS)
    print(f'CPU frequency range: {CPU_FREQUENCY}')
