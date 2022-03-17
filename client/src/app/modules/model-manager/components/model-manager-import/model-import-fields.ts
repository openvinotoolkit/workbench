import { Validators } from '@angular/forms';

import { Dictionary } from '@ngrx/entity';

import { ModelFrameworks } from '@store/model-store/model.model';

import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';

export interface FileField {
  name: string;
  label?: string;
  uploadingDir?: boolean;
  multiple?: boolean;
  acceptedFiles?: string;
  optional?: boolean;
  maxFileSizeMb: number;
  tooltip?: {
    prefix: string;
    value: string;
  };
}

const modelTextFileMaxSizeMb = 5;
const modelBinaryFileMaxSizeMb = 2000;
const allModelFilesMaxSizeMb = 2000;

export const modelFrameworkFileFieldsMap: Dictionary<FileField[]> = {
  [ModelFrameworks.OPENVINO]: [
    {
      name: 'xmlFile',
      label: 'IR XML file',
      acceptedFiles: '.xml',
      maxFileSizeMb: modelTextFileMaxSizeMb,
      tooltip: {
        prefix: 'uploadFilePage',
        value: 'irTooltip',
      },
    },
    {
      name: 'binFile',
      label: 'IR BIN file',
      acceptedFiles: '.bin',
      maxFileSizeMb: allModelFilesMaxSizeMb - modelTextFileMaxSizeMb,
      tooltip: {
        prefix: 'uploadFilePage',
        value: 'irTooltip',
      },
    },
  ],
  [ModelFrameworks.CAFFE]: [
    {
      name: 'prototxtFile',
      label: 'prototxt file',
      acceptedFiles: '.prototxt',
      maxFileSizeMb: modelTextFileMaxSizeMb,
    },
    {
      name: 'caffemodelFile',
      label: 'caffemodel file',
      acceptedFiles: '.caffemodel',
      maxFileSizeMb: allModelFilesMaxSizeMb - modelTextFileMaxSizeMb,
    },
  ],
  [ModelFrameworks.MXNET]: [
    {
      name: 'jsonFile',
      label: 'json file',
      acceptedFiles: '.json',
      maxFileSizeMb: modelTextFileMaxSizeMb,
    },
    {
      name: 'paramsFile',
      label: 'params file',
      acceptedFiles: '.params',
      maxFileSizeMb: allModelFilesMaxSizeMb - modelTextFileMaxSizeMb,
    },
  ],
  [ModelFrameworks.ONNX]: [
    {
      name: 'onnxFile',
      label: 'onnx file',
      acceptedFiles: '.onnx',
      maxFileSizeMb: allModelFilesMaxSizeMb,
    },
  ],
};

interface TFModelUtilFieldsMap {
  tfVersion: AdvancedConfigField;
  isFrozenModel: AdvancedConfigField;
  inputFilesType: AdvancedConfigField;
  isKerasModel: AdvancedConfigField;
}

export enum TFInputFileTypes {
  CHECKPOINT = 'checkpoint',
  METAGRAPH = 'metagraph',
}

export const tfModelUtilFieldsMap: TFModelUtilFieldsMap = {
  tfVersion: {
    name: 'tfVersion',
    label: 'TensorFlow version',
    type: 'radio',
    value: 1,
    options: [
      { name: '1.X', value: 1 },
      { name: '2.X', value: 2 },
    ],
  },
  isFrozenModel: {
    name: 'isFrozenModel',
    label: 'Is Frozen Model',
    type: 'checkbox',
    value: true,
    tooltip: {
      prefix: 'convertModel',
      value: 'isFrozen',
    },
  },
  inputFilesType: {
    name: 'inputFilesType',
    label: 'Input files type',
    type: 'select',
    value: null,
    options: [
      { name: 'Checkpoint', value: TFInputFileTypes.CHECKPOINT },
      { name: 'MetaGraph', value: TFInputFileTypes.METAGRAPH },
    ],
    validators: [Validators.required],
  },
  isKerasModel: {
    name: 'isKerasModel',
    label: 'Is Keras Model',
    type: 'checkbox',
    value: false,
  },
};

export const tfModelFileFieldsMap = {
  tf2FileInputs: [
    {
      name: 'savedModelDir',
      label: 'Saved Model Folder',
      uploadingDir: true,
      maxFileSizeMb: allModelFilesMaxSizeMb,
    },
  ] as FileField[],
  kerasModel: [
    {
      name: 'kerasModel',
      label: 'Keras Model',
      acceptedFiles: '.h5',
      maxFileSizeMb: allModelFilesMaxSizeMb,
    },
  ] as FileField[],
  frozenFileInputs: [
    {
      name: 'frozenGraphFile',
      label: 'pb OR pbtxt file',
      acceptedFiles: '.pb,.pbtxt',
      maxFileSizeMb: allModelFilesMaxSizeMb,
    },
  ] as FileField[],
  checkpointFileInputs: [
    {
      name: 'pbFile',
      label: 'pb OR pbptxt file',
      acceptedFiles: '.pb,.pbtxt',
      maxFileSizeMb: modelBinaryFileMaxSizeMb,
    },
    {
      name: 'checkpoint',
      label: 'checkpoint file(s)',
      multiple: true,
      maxFileSizeMb: allModelFilesMaxSizeMb - modelBinaryFileMaxSizeMb,
      tooltip: {
        prefix: 'convertModel',
        value: 'checkpointFile',
      },
    },
  ] as FileField[],
  metagraphFileInputs: [
    {
      name: 'metaFile',
      label: 'meta file',
      acceptedFiles: '.meta',
      maxFileSizeMb: 200,
      tooltip: {
        prefix: 'convertModel',
        value: 'metaFile',
      },
    },
    {
      name: 'indexFile',
      label: 'index file',
      acceptedFiles: '.index',
      maxFileSizeMb: 200,
      tooltip: {
        prefix: 'convertModel',
        value: 'indexFile',
      },
    },
    {
      name: 'dataFile',
      label: 'data file',
      maxFileSizeMb: allModelFilesMaxSizeMb - 200 * 2,
      tooltip: {
        prefix: 'convertModel',
        value: 'dataFile',
      },
    },
  ] as FileField[],
};

export const getFileNameWithoutExtension = (fileName: string): string =>
  !fileName ? null : fileName.replace(/\.[^/.]+$/, '');
