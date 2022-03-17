"""
 OpenVINO DL Workbench
 Parameters for Model Optimizer related endpoints

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
from numbers import Real
from pathlib import Path
from typing import Callable, Iterable, List, Mapping, Optional

from config.constants import PREDEFINED_CONFIG_NAMES_TO_PATH_MAP
from wb.main.enumerates import SupportedFrameworksEnum, ModelPrecisionEnum, ModelColorChannelsEnum, LayoutDimValuesEnum


class Param:
    # pylint: disable=too-many-arguments
    def __init__(self, param_name: str, cli_arg_name: str = None,
                 required: bool = False, scope: set = None,
                 validate: Callable = None, to_arg: Callable = None, to_param: Callable = None):
        self.param_name = param_name
        self.cli_arg_name = cli_arg_name
        self.required = required
        self.scope = scope or {'general'}
        self.validate = validate if validate else lambda v: isinstance(v, str)
        self.to_arg = to_arg if to_arg else lambda v: v
        self.to_param = to_param if to_param else lambda v: v


class InputsParam(Param):
    keys_config = {
        'name': {
            'required': True,
            'validate': lambda v: isinstance(v, str),
        },
        'shape': {
            'required': False,
            'validate': lambda v: isinstance(v, list) and all(isinstance(element, int) for element in v),
        },
        'means': {
            'required': False,
            'validate': lambda v: isinstance(v, list) and all(isinstance(element, Real) for element in v),
        },
        'scales': {
            'required': False,
            'validate': lambda v: isinstance(v, list) and all(isinstance(element, Real) for element in v),
        },
        'freezePlaceholderWithValue': {
            'required': False,
            'validate': lambda v: isinstance(v, str),
        },
        'layout': {
            'required': False,
            'validate': lambda v: InputsParam._validate_layout(v),
        }
    }

    def __init__(self, param_name):
        super().__init__(param_name, validate=self._validate)
        self.to_arg = None
        self.to_param = None

    @staticmethod
    def _validate_layout(layout: List[str]) -> bool:
        try:
            if not all(isinstance(l, str) and LayoutDimValuesEnum(l) for l in layout):
                return False
        except ValueError:
            return False
        return True

    @classmethod
    def validate_element(cls, element: Mapping) -> Optional[Mapping]:
        errors = {
            'unknown': [],
            'missing': [],
            'invalid': {},
        }

        required_keys = set(k for k, p in cls.keys_config.items() if p['required'])
        errors['missing'] = list(required_keys - set(element.keys()))

        for key, value in element.items():
            if key not in cls.keys_config:
                errors['unknown'].append(key)
            if not cls.keys_config[key]['validate'](value):
                errors['invalid'][key] = value

        return errors if any(errors.values()) else None

    @classmethod
    def _validate(cls, value: Iterable[Mapping]) -> bool:
        return bool(value) and isinstance(value, list) and not any(cls.validate_element(e) for e in value)


class MOForm:
    params_config = [
        Param(
            'batch',
            cli_arg_name='batch',
            validate=lambda v: isinstance(v, int) and v > 0,
        ),
        Param(
            'dataType',  # precision
            cli_arg_name='data_type',
            required=True,
            validate=lambda v: v in (ModelPrecisionEnum.fp16.value, ModelPrecisionEnum.fp32.value),
        ),
        Param(
            'originalChannelsOrder',
            cli_arg_name='reverse_input_channels',
            required=True,
            validate=lambda v: v in ModelColorChannelsEnum.values(),
        ),
        Param(
            'originalLayout',
            cli_arg_name='disable_nhwc_to_nchw',
            scope={SupportedFrameworksEnum.tf.value,
                   SupportedFrameworksEnum.tf2.value,
                   SupportedFrameworksEnum.tf2_keras.value},
            validate=lambda v: v in ('NCHW', 'NHWC'),
            to_arg=lambda v: v == 'NCHW',  # If NHWC - reorder, to make it be NHWC
            to_param=lambda v: 'NCHW' if v else 'NHWC',
        ),
        Param(
            'predefinedTransformationsConfig',
            cli_arg_name='transformations_config',
            validate=lambda v: v in PREDEFINED_CONFIG_NAMES_TO_PATH_MAP,
            to_arg=lambda v: PREDEFINED_CONFIG_NAMES_TO_PATH_MAP[v],
            to_param=lambda v: Path(v).name
        ),
        InputsParam('inputs'),
        Param(
            'outputs',
            cli_arg_name='output',
            validate=lambda v: isinstance(v, list) and all(isinstance(element, str) for element in v),
            to_arg=','.join,
            to_param=lambda v: v.split(','),
        ),
        Param(
            'enableSsdGluoncv',
            cli_arg_name='enable_ssd_gluoncv',
            scope={SupportedFrameworksEnum.mxnet.value},
            validate=lambda v: isinstance(v, bool),
        ),
        Param(
            'legacyMxnetModel',
            cli_arg_name='legacy_mxnet_model',
            scope={SupportedFrameworksEnum.mxnet.value},
            validate=lambda v: isinstance(v, bool),
        ),
    ]

    def __init__(self, data: dict, framework: str):
        self.data = {k: v for k, v in data.items() if v is not None}
        self.framework = framework
        self.is_invalid = None
        self.errors = None
        self.validate()

    @classmethod
    def get_param_name_to_param_conf_map(cls) -> dict:
        return {
            param_conf.param_name: param_conf
            for param_conf in cls.params_config
        }

    @classmethod
    def get_cli_arg_name_to_param_conf_map(cls) -> dict:
        return {
            param_conf.cli_arg_name: param_conf
            for param_conf in cls.params_config
            if param_conf.cli_arg_name
        }

    def validate(self) -> Optional[Mapping]:
        errors = {
            'missing': [],
            'unknown': [],
            'unsuitable': [],
            'invalid': {},
        }
        scopes = {'general', self.framework}

        required_params = set(p.param_name for p in self.params_config if p.required and p.scope in scopes)
        errors['missing'] = list(required_params - set(self.data.keys()))

        params_config_map = self.get_param_name_to_param_conf_map()

        for key, value in self.data.items():
            if key not in params_config_map:
                errors['unknown'].append(key)
                continue
            if not params_config_map[key].scope.intersection(scopes):
                errors['unsuitable'].append(key)
            if not params_config_map[key].validate(value):
                errors['invalid'][key] = value

        self.is_invalid = any(errors.values())
        self.errors = errors if self.is_invalid else None
        return self.errors

    def _prepare_channels_order_dependent_values(self, key: str, arg_name: str, args: dict):
        values = {input_['name']: input_[key] for input_ in self.data['inputs'] if key in input_}
        if self.data.get('originalChannelsOrder') == 'BGR':
            values = {k: list(reversed(value)) for k, value in values.items()}
        prepared_values = ','.join(
            f'{k}[{",".join(str(float(v)) for v in value)}]'
            for k, value in values.items()
        )
        if prepared_values:
            args[arg_name] = prepared_values

    @staticmethod
    def _prepare_placeholders(names: List, placeholders: List, args: dict):
        if any(placeholders):
            inputs = zip(names, placeholders)
            processed_values = []
            for name, placeholder in inputs:
                if placeholder:
                    processed_values.append(f'{name}->{placeholder}')
            args['freeze_placeholder_with_value'] = ','.join(processed_values)

    def get_args(self) -> dict:
        if self.is_invalid:
            raise ValueError(self.errors)

        params_config_map = self.get_param_name_to_param_conf_map()

        args = {
            params_config_map[key].cli_arg_name: params_config_map[key].to_arg(value)
            for key, value in self.data.items()
            if params_config_map[key].cli_arg_name
        }

        if 'inputs' in self.data:
            inputs = self.data['inputs']

            if 'batch' in self.data:
                del args['batch']

            self._prepare_channels_order_dependent_values('means', 'mean_values', args)
            self._prepare_channels_order_dependent_values('scales', 'scale_values', args)

            input_names = [input_['name'] for input_ in inputs]
            input_placeholders = [input_.get('freezePlaceholderWithValue') for input_ in inputs]

            args['input'] = ','.join(input_names)

            input_shapes = [input_['shape'] for input_ in inputs if 'shape' in input_]
            if input_shapes:
                args['input_shape'] = ','.join(
                    f'[{",".join(str(int(element)) for element in shape)}]'
                    for shape in input_shapes
                )

            input_layouts = {input_['name']: input_['layout'] for input_ in inputs if 'layout' in input_}
            if input_layouts:
                args['layout'] = input_layouts

            self._prepare_placeholders(input_names, input_placeholders, args)

        return args

    @classmethod
    def _transformations_config_to_param(cls, mo_args: dict, params: dict):
        pipeline_config_file_path = mo_args.get('transformations_config')
        if not pipeline_config_file_path:
            return
        pipeline_config_file_name = Path(pipeline_config_file_path).stem
        if pipeline_config_file_name not in PREDEFINED_CONFIG_NAMES_TO_PATH_MAP:
            params['customTransformationsConfig'] = Path(pipeline_config_file_path).name
            # If transformations_config file name is not in PREDEFINED_CONFIG_NAMES_TO_PATH_MAP
            # Need leave in params only the customTransformationsConfig field
            if params['predefinedTransformationsConfig']:
                del params['predefinedTransformationsConfig']

    @classmethod
    def to_params(cls, mo_args: dict):
        arg_to_param_map = cls.get_cli_arg_name_to_param_conf_map()

        params = {
            arg_to_param_map[arg].param_name: arg_to_param_map[arg].to_param(value)
            for arg, value in mo_args.items()
            if arg in arg_to_param_map
        }

        pipeline_config_file_path = mo_args.get('tensorflow_object_detection_api_pipeline_config')
        if pipeline_config_file_path:
            params['isPipelineConfigPersisted'] = True

        cls._transformations_config_to_param(mo_args, params)

        if 'input' in mo_args:
            parsed_values = {arg_name: {} for arg_name in ('mean_values', 'scale_values')}
            for arg_name in parsed_values:
                if arg_name in mo_args:
                    for layer_values in mo_args[arg_name].split('],'):
                        name, vector_str = layer_values.split('[')
                        parsed_values[arg_name][name] = [float(value) for value in vector_str.rstrip(']').split(',')]
                        if params.get('originalChannelsOrder') == 'RGB':
                            parsed_values[arg_name][name] = list(reversed(parsed_values[arg_name][name]))

            names = mo_args['input'].split(',')
            shapes = [
                [int(e) for e in shape_string.lstrip('[').rstrip(']').split(',') if e]
                for shape_string in mo_args['input_shape'].split('],')
            ] if 'input_shape' in mo_args else []
            layouts = mo_args.get('layout', {})

            freeze_placeholders = cls._parse_freeze_placeholder_with_value(mo_args)

            params['inputs'] = []
            for index, name in enumerate(names):
                input_ = {
                    'name': name,
                }
                if index < len(shapes) and shapes[index]:
                    input_['shape'] = shapes[index]
                if name in parsed_values['mean_values']:
                    input_['means'] = parsed_values['mean_values'][name]
                if name in parsed_values['scale_values']:
                    input_['scales'] = parsed_values['scale_values'][name]
                if name in freeze_placeholders:
                    input_['freezePlaceholderWithValue'] = freeze_placeholders[name]
                if name in layouts:
                    input_['layout'] = layouts[name]

                params['inputs'].append(input_)
        return params

    @staticmethod
    def _parse_freeze_placeholder_with_value(mo_args: dict) -> dict:
        freeze_placeholder_with_value = mo_args.get('freeze_placeholder_with_value')
        if not freeze_placeholder_with_value:
            return {}

        result = {}

        for entry in freeze_placeholder_with_value.split(','):
            input_name, freeze_value = entry.split('->')
            result[input_name] = freeze_value

        return result
