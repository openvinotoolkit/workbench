"""
 OpenVINO DL Workbench
 Script to check internet connection

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
