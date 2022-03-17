import { FormControl, FormGroup } from '@angular/forms';

import { Subscription } from 'rxjs';

import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';

export const createControl = (field: AdvancedConfigField) =>
  new FormControl(
    {
      value: field.value,
      disabled: field.disabled,
    },
    field.validators
  );

export class Subscriptions {
  private _subs: Subscription[] = [];

  set add(value: Subscription) {
    this._subs.push(value);
  }

  public unsubscribe(): void {
    this._subs.forEach((s) => s.unsubscribe());
    this._subs = [];
  }
}

export interface IFormFeatureHandler<T> {
  readonly group: FormGroup;
  readonly orderedFields: { field: AdvancedConfigField; group: FormGroup }[];
  setValue: (preProcessor: T) => void;
  getValue: () => T;
  destroy: () => void;
}
