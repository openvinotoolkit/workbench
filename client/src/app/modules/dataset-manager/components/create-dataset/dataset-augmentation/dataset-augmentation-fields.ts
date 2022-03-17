import { Validators } from '@angular/forms';

import { IImageCorrection } from '@store/dataset-store/dataset.model';

import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';

export enum AugmentationFormFieldNames {
  HORIZONTAL_FLIP = 'applyHorizontalFlip',
  VERTICAL_FLIP = 'applyVerticalFlip',
  RANDOM_ERASE = 'applyErase',
  NOISE_INJECTION = 'applyNoise',
  IMAGE_CORRECTIONS = 'applyImageCorrections',
  ERASE_RATIO = 'eraseRatio',
  ERASE_IMAGES = 'eraseImages',
  NOISE_RATIO = 'noiseRatio',
  NOISE_IMAGES = 'noiseImages',
}

const horizontalFlipField: AdvancedConfigField = {
  type: 'checkbox',
  name: AugmentationFormFieldNames.HORIZONTAL_FLIP,
  value: false,
};

const verticalFlipField: AdvancedConfigField = {
  type: 'checkbox',
  name: AugmentationFormFieldNames.VERTICAL_FLIP,
  value: false,
};

const applyEraseField: AdvancedConfigField = {
  type: 'checkbox',
  name: AugmentationFormFieldNames.RANDOM_ERASE,
  value: false,
};

const applyNoiseField: AdvancedConfigField = {
  type: 'checkbox',
  name: AugmentationFormFieldNames.NOISE_INJECTION,
  value: false,
};

const changeColorSpace: AdvancedConfigField = {
  type: 'checkbox',
  name: AugmentationFormFieldNames.IMAGE_CORRECTIONS,
  value: false,
};

const eraseFields: AdvancedConfigField[] = [
  {
    type: 'input',
    label: 'Erase Ratio',
    name: AugmentationFormFieldNames.ERASE_RATIO,
    value: 10,
    maxNumber: 100,
    numberType: 'float',
    validators: [Validators.required, Validators.min(1), Validators.max(20)],
    suffix: '%',
  },
  {
    type: 'input',
    label: 'Images to Generate',
    name: AugmentationFormFieldNames.ERASE_IMAGES,
    value: 10,
    maxNumber: 100,
    numberType: 'integer',
    validators: [Validators.required, Validators.min(1), Validators.max(20)],
  },
];
const noiseFields: AdvancedConfigField[] = [
  {
    type: 'input',
    label: 'Noise Injection',
    name: AugmentationFormFieldNames.NOISE_RATIO,
    value: 5,
    maxNumber: 5,
    numberType: 'float',
    validators: [Validators.required, Validators.min(1), Validators.max(5)],
    suffix: '%',
  },
  {
    type: 'input',
    label: 'Images to Generate',
    name: AugmentationFormFieldNames.NOISE_IMAGES,
    value: 10,
    maxNumber: 100,
    numberType: 'integer',
    validators: [Validators.required, Validators.min(1), Validators.max(20)],
  },
];

export const colorSpacePresets: IImageCorrection[] = [
  {
    name: 'Preset 1',
    brightness: 1.2,
    contrast: 1.2,
  },
  {
    name: 'Preset 2',
    brightness: 1.2,
    contrast: 0.8,
  },
  {
    name: 'Preset 3',
    brightness: 1.0,
    contrast: 1.2,
  },
  {
    name: 'Preset 4',
    brightness: 0.8,
    contrast: 1.0,
  },
  {
    name: 'Preset 5',
    brightness: 0.8,
    contrast: 1.2,
  },
  {
    name: 'Preset 6',
    brightness: 0.8,
    contrast: 0.8,
  },
];

export const dataAugmentationFormFieldsMap = {
  horizontalFlipField,
  verticalFlipField,
  applyEraseField,
  applyNoiseField,
  changeColorSpace,
  eraseFields,
  noiseFields,
};
