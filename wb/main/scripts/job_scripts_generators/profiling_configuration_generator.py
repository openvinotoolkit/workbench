"""
 OpenVINO DL Workbench
 Class to generate configuration file for profiling

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
import json
import os
from collections import defaultdict
from typing import Tuple, List, Callable, Optional

from typing_extensions import TypedDict

from wb.main.enumerates import DeviceTypeEnum, TargetTypeEnum
from wb.main.models import (ProfilingJobModel, ProjectsModel, TargetModel, SingleInferenceInfoModel,
                            TopologiesModel)
from wb.main.utils.utils import find_by_ext


class StreamBatchSet(TypedDict):
    batch: int
    numStreams: int


class ProfilingInputFileMapping:
    def __init__(self, inputs_data_paths: str = None):
        self._input_names_to_files_map = defaultdict(list)
        if not inputs_data_paths:
            return
        inputs_with_paths = inputs_data_paths.split(',')
        for input_with_path in inputs_with_paths:
            input_name, file_path = input_with_path.split(':')
            self.add_input_file(input_name=input_name, file_path=file_path)

    def add_input_file(self, input_name: str, file_path: str):
        self._input_names_to_files_map[input_name].append(str(file_path))

    def update_paths(self, transform: Callable[[str], str]):
        for input_name, input_paths in self._input_names_to_files_map.items():
            self._input_names_to_files_map[input_name] = [transform(path) for path in input_paths]

    def __str__(self) -> str:
        return ','.join(
            f'{input_name}:' + ','.join(files)
            for input_name, files in self._input_names_to_files_map.items()
        )


class ProfilingConfigurationFileGenerator:
    def __init__(self, profiling_job: ProfilingJobModel,
                 profiling_input_file_mapping: Optional[ProfilingInputFileMapping] = None):
        self.profiling_job = profiling_job
        self._profiling_input_file_mapping = profiling_input_file_mapping

    def generate(self):
        configuration = self._generate_configuration()

        with open(self.profiling_job.configuration_file_path, 'w') as configuration_file:
            json.dump(configuration, configuration_file)

    @staticmethod
    def get_model_path(model: TopologiesModel) -> Tuple[str, str]:
        raise NotImplementedError

    def get_input_data_path(self) -> Optional[str]:
        raise NotImplementedError

    @staticmethod
    def _get_batch_num_stream_list(single_inference_infos: List[SingleInferenceInfoModel]) -> List[StreamBatchSet]:
        parameters: List[StreamBatchSet] = []
        for single_inference_info in single_inference_infos:
            batch = single_inference_info.batch
            num_streams = single_inference_info.nireq
            parameters.append(StreamBatchSet(
                batch=batch,
                numStreams=num_streams
            ))
        return parameters

    def _generate_configuration(self) -> dict:
        project: ProjectsModel = self.profiling_job.project
        device = project.device.device_name

        xml_model_path, _ = self.get_model_path(project.topology)

        return {
            'modelPath': xml_model_path,
            'inputPath': self.get_input_data_path(),
            'device': device,
            'time': self.profiling_job.inference_time,
            'parallelizeType': 'nireq' if DeviceTypeEnum.is_vpu(device) else 'nstreams',
            'inferenceConfigurations': self._get_batch_num_stream_list(self.profiling_job.profiling_results)
        }


class LocalProfilingConfigurationFileGenerator(ProfilingConfigurationFileGenerator):
    @staticmethod
    def get_model_path(model: TopologiesModel) -> Tuple[str, str]:
        return find_by_ext(model.path, 'xml'), find_by_ext(model.path, 'bin')

    def get_input_data_path(self) -> Optional[str]:
        input_data_path = self._profiling_input_file_mapping or self.profiling_job.input_data_path
        return str(input_data_path) if input_data_path else None


class RemoteProfilingConfigurationFileGenerator(ProfilingConfigurationFileGenerator):
    @staticmethod
    def get_model_path(model: TopologiesModel) -> Tuple[str, str]:
        xml_path = os.path.basename(find_by_ext(model.path, 'xml'))
        bin_path = os.path.basename(find_by_ext(model.path, 'bin'))
        return os.path.join('model', f'{xml_path}'), os.path.join('model', f'{bin_path}')

    def get_input_data_path(self) -> Optional[str]:
        input_data_path = self._profiling_input_file_mapping or self.profiling_job.input_data_path
        if not input_data_path:
            return None

        base_input_data_path = self.profiling_job.input_data_base_dir_path

        def get_relative_path(path: str) -> str:
            relative_input_data_path = os.path.relpath(path, base_input_data_path)
            return os.path.join('dataset', relative_input_data_path)

        # Handling inputs and paths use case ('input_1:path_1,input_2:path_2')
        if ':' in input_data_path:
            profiling_input_file_mapping = ProfilingInputFileMapping(inputs_data_paths=input_data_path)
            profiling_input_file_mapping.update_paths(transform=get_relative_path)
            return str(profiling_input_file_mapping)

        # Handling multiple paths use case ('path_1,path_2')
        if ',' in input_data_path:
            return ','.join([get_relative_path(path) for path in input_data_path.split(',')])

        # Handling single path use case ('path_1')
        return get_relative_path(input_data_path)


def get_profiling_configuration_generator(
        profiling_job: ProfilingJobModel,
        profiling_input_file_mapping: ProfilingInputFileMapping
) -> ProfilingConfigurationFileGenerator:
    target: TargetModel = profiling_job.project.target
    if target.target_type in (TargetTypeEnum.remote, TargetTypeEnum.dev_cloud):
        return RemoteProfilingConfigurationFileGenerator(profiling_job, profiling_input_file_mapping)
    return LocalProfilingConfigurationFileGenerator(profiling_job, profiling_input_file_mapping)
