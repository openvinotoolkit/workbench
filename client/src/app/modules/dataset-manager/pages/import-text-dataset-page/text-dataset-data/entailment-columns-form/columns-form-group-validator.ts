import { AbstractControl, UntypedFormGroup } from '@angular/forms';

import { isNumber } from 'lodash';

import { ValidatorError } from '@shared/components/config-form-field/custom-validators';
import { FormUtils } from '@shared/utils/form-utils';

/**
 * Set 'unique' error for controls with duplicated values in provided FormGroup
 * @param control
 */
export const uniqueColumnsGroupValidator = (control: UntypedFormGroup): ValidatorError | null => {
  Object.values(control.controls).forEach((c) => FormUtils.removeErrors(['unique'], c));

  // group controls by number value
  const controlsMap: { [key: number]: AbstractControl[] } = Object.values(control.controls).reduce((acc, c) => {
    if (!isNumber(c.value)) {
      return acc;
    }

    acc[c.value] = !acc[c.value] ? [c] : [...acc[c.value], c];
    return acc;
  }, {});

  // duplicated values controls - set error
  const controls = Object.values(controlsMap)
    .filter((c) => c.length > 1)
    .flat();

  if (!controls.length) {
    return null;
  }

  const error = () => ({ unique: { message: 'Value should be unique' } });
  controls.forEach((c) => FormUtils.addErrors(error(), c));

  return error();
};
