import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { includes, isArray, isEmpty } from 'lodash';

export function matchesOptionsValidator(options: string[] = []): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const selectedValue = control.value;
    const validationError = { matchesOptions: false };
    if (!isArray(options)) {
      return validationError;
    }
    return isEmpty(options) || includes(options, selectedValue) ? null : validationError;
  };
}
