import { Validators } from '@angular/forms';

import { Dictionary } from '@ngrx/entity';

import { DatasetTypes, DatasetTypeToNameMap } from '@store/dataset-store/dataset.model';

import { CustomValidators } from '@shared/components/config-form-field/custom-validators';
import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';

import { FileField } from '../../../model-manager/components/model-manager-import/model-import-fields';

export const datasetUploadFormFields: Dictionary<AdvancedConfigField> = {
  datasetName: {
    type: 'text',
    label: 'Dataset Name',
    name: 'datasetNameControl',
    validators: [Validators.maxLength(30), Validators.required, CustomValidators.nameSafeCharacters],
    value: '',
    tooltip: {
      prefix: 'uploadFilePage',
      value: 'name',
    },
  },
  datasetType: {
    type: 'select',
    label: 'Dataset Type',
    name: 'datasetType',
    value: 'autodetect',
    options: [
      { value: 'autodetect', name: 'Auto-detect' },
      { value: DatasetTypes.IMAGE_NET_TXT, name: DatasetTypeToNameMap[DatasetTypes.IMAGE_NET_TXT] },
      { value: DatasetTypes.IMAGE_NET, name: DatasetTypeToNameMap[DatasetTypes.IMAGE_NET] },
      { value: DatasetTypes.VOC, name: DatasetTypeToNameMap[DatasetTypes.VOC] },
      { value: DatasetTypes.COCO, name: DatasetTypeToNameMap[DatasetTypes.COCO] },
      {
        value: DatasetTypes.COMMON_SEMANTIC_SEGMENTATION,
        name: DatasetTypeToNameMap[DatasetTypes.COMMON_SEMANTIC_SEGMENTATION],
      },
      { value: DatasetTypes.COMMON_SUPER_RESOLUTION, name: DatasetTypeToNameMap[DatasetTypes.COMMON_SUPER_RESOLUTION] },
      { value: DatasetTypes.LFW, name: DatasetTypeToNameMap[DatasetTypes.LFW] },
      { value: DatasetTypes.VGG_FACE_2, name: DatasetTypeToNameMap[DatasetTypes.VGG_FACE_2] },
      { value: DatasetTypes.WIDER_FACE, name: DatasetTypeToNameMap[DatasetTypes.WIDER_FACE] },
      { value: DatasetTypes.OPEN_IMAGES, name: DatasetTypeToNameMap[DatasetTypes.OPEN_IMAGES] },
      { value: DatasetTypes.CITYSCAPES, name: DatasetTypeToNameMap[DatasetTypes.CITYSCAPES] },
    ],
    tooltip: {
      prefix: 'uploadFilePage',
      value: 'datasetType',
    },
  },
};

export const datasetUploadFileField: FileField = {
  name: 'selectedFile',
  label: 'Select File',
  maxFileSizeMb: 10000,
  acceptedFiles: '.zip,.gz,.tar',
  tooltip: {
    prefix: 'uploadFilePage',
    value: 'imageDatasetFile',
  },
};
