"""
 OpenVINO DL Workbench
 Class for storing int8 calibration cli params

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

from pathlib import Path

from wb.main.console_tool_wrapper.console_parameter_validator import ConsoleParametersTypes
from wb.main.console_tool_wrapper.python_console_tool import PythonModuleTool


class ModelOptimizerTool(PythonModuleTool):
    def __init__(self, python_executable: Path, mo_args: dict = None,
                 environment: dict = None):
        super().__init__(python_exec=python_executable, environment=environment)
        self.exe = 'openvino.tools.mo'
        self.parameter_prefix = '--'
        self.setup_common_parameters(mo_args)
        self.setup_tf_parameters(mo_args)
        self.setup_caffe_parameters(mo_args)
        self.setup_mxnet_parameters(mo_args)

    def setup_mxnet_parameters(self, mo_args: dict):
        self.set_mo_parameter_if_exist('legacy_mxnet_model', ConsoleParametersTypes.flag, mo_args)
        self.set_mo_parameter_if_exist('enable_ssd_gluoncv', ConsoleParametersTypes.flag, mo_args)

    def setup_common_parameters(self, mo_args: dict):
        self.set_mo_parameter_if_exist('data_type', ConsoleParametersTypes.precision, mo_args)
        self.set_mo_parameter_if_exist('reverse_input_channels', ConsoleParametersTypes.flag, mo_args)
        self.set_mo_parameter_if_exist('output', ConsoleParametersTypes.filename, mo_args)
        self.set_mo_parameter_if_exist('input', ConsoleParametersTypes.filename, mo_args)  # TODO: 53535
        self.set_mo_parameter_if_exist('mean_values', ConsoleParametersTypes.mean_scale_values, mo_args)
        self.set_mo_parameter_if_exist('scale_values', ConsoleParametersTypes.mean_scale_values, mo_args)
        self.set_mo_parameter_if_exist('input_shape', ConsoleParametersTypes.input_shape, mo_args)
        self.set_mo_parameter_if_exist('input_model', ConsoleParametersTypes.path, mo_args)
        self.set_mo_parameter_if_exist('model_name', ConsoleParametersTypes.filename, mo_args)
        self.set_mo_parameter_if_exist('framework', ConsoleParametersTypes.framework, mo_args)
        self.set_mo_parameter_if_exist('output_dir', ConsoleParametersTypes.path, mo_args)
        self.set_mo_parameter_if_exist('progress', ConsoleParametersTypes.flag, mo_args)
        self.set_mo_parameter_if_exist('stream_output', ConsoleParametersTypes.flag, mo_args)
        self.set_mo_parameter_if_exist('transformations_config', ConsoleParametersTypes.path, mo_args)
        self.set_mo_parameter_if_exist('freeze_placeholder_with_value',
                                       ConsoleParametersTypes.input_placeholder, mo_args)  # TODO: 53535
        self.set_mo_parameter_if_exist('layout',
                                       ConsoleParametersTypes.layout, mo_args)

    def setup_caffe_parameters(self, mo_args: dict):
        self.set_mo_parameter_if_exist('input_proto', ConsoleParametersTypes.path, mo_args)

    def setup_tf_parameters(self, mo_args: dict):
        self.set_mo_parameter_if_exist('input_meta_graph', ConsoleParametersTypes.path, mo_args)
        self.set_mo_parameter_if_exist('input_checkpoint', ConsoleParametersTypes.path, mo_args)
        self.set_mo_parameter_if_exist('tensorflow_object_detection_api_pipeline_config', ConsoleParametersTypes.path,
                                       mo_args)
        self.set_mo_parameter_if_exist('input_model_is_text', ConsoleParametersTypes.flag, mo_args)
        self.set_mo_parameter_if_exist('disable_nhwc_to_nchw', ConsoleParametersTypes.flag, mo_args)
        self.set_mo_parameter_if_exist('saved_model_dir', ConsoleParametersTypes.path, mo_args)

    def set_mo_parameter_if_exist(self, name: str,
                                  parameter_type: ConsoleParametersTypes = None,
                                  args: dict = None):
        if name in args:
            self.set_parameter(name, args.get(name), parameter_type)
