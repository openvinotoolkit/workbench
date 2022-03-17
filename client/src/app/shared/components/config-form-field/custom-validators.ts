import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { every, gte, isEmpty, isFinite, isNumber } from 'lodash';

const ARTIFACT_NAME_SAFE_CHARACTERS_REGEX = /^[\d\w\-\_\ .]*$/;

export interface ValidatorError {
  [key: string]: ValidatorError | string | number | boolean;
}

export class CustomValidators {
  static nameSafeCharacters(control: AbstractControl): ValidatorError | null {
    const safe = ARTIFACT_NAME_SAFE_CHARACTERS_REGEX.test(control.value);
    return safe
      ? null
      : {
          nameUnsafeCharacters: {
            value: control.value,
            message: 'Field contains one or more invalid characters. Read help for more information.',
          },
        };
  }

  static dimension(allowDynamic: boolean): ValidatorFn {
    const minValue = allowDynamic ? -1 : 0;

    return (control: AbstractControl) =>
      control.value < minValue ? { wrongDimension: { message: `Must be >= ${minValue}`, value: control.value } } : null;
  }

  static validateNumberArray(minDimensionValue: number = -Infinity): ValidatorFn {
    return (control: AbstractControl): ValidationErrors => {
      const { value } = control;
      if (!isNumber(minDimensionValue)) {
        minDimensionValue = -Infinity;
      }
      if (isEmpty(value) || !every(value, isFinite) || !every(value, (input) => gte(input, minDimensionValue))) {
        return { dimensionsInputError: true };
      }
      return null;
    };
  }

  static requiredBatch(control: AbstractControl): ValidationErrors {
    const batchSymbol = 'N';
    const inputs: { layout: string[] }[] = control.value || [];

    if (inputs.every((input) => !input?.layout)) {
      return null;
    }

    const batch = inputs
      .filter((value) => value)
      .find(({ layout }) => (layout || []).find((value) => value === batchSymbol));

    return batch ? null : { inputLayers: 'At least one of the Layout Role fields must be defined as Batch' };
  }

  static validateBatch(control: AbstractControl): ValidatorError {
    const batchSymbol = 'N';
    const inputs: { layout: string[]; shape: number[] }[] = control.value || [];

    if (inputs.every((input) => !input?.layout)) {
      return null;
    }

    const hasInvalidBatchValue = inputs
      .filter((value) => value)
      .find(({ layout, shape }) => {
        if (!layout?.length) {
          return;
        }

        for (let i = 0; i < layout.length; i++) {
          if (layout[i] === batchSymbol && shape[i] < 1) {
            return true;
          }
        }
      });

    return hasInvalidBatchValue && { inputLayers: 'The Shape of the Batch dimension must be > 0' };
  }
}
