import { AbstractControl, UntypedFormControl, UntypedFormGroup } from '@angular/forms';

import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';

export class FormUtils {
  static addControlsToForm(fields: AdvancedConfigField[] = [], form: UntypedFormGroup): void {
    fields.forEach(({ name, value, validators }) => {
      form.addControl(name, new UntypedFormControl(value, validators));
    });
  }

  static removeControlsFromForm(fields: AdvancedConfigField[] = [], form: UntypedFormGroup): void {
    fields.forEach(({ name }) => {
      form.removeControl(name);
    });
  }

  static getFileTextContentPromise(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const fileReader: FileReader = new FileReader();
      fileReader.onload = (event: ProgressEvent) => {
        resolve(event.target['result']);
      };
      fileReader.onerror = reject;
      fileReader.readAsText(file);
    });
  }

  public static removeErrors(keys: string[], control: AbstractControl) {
    if (!control || !keys || keys.length === 0) {
      return;
    }

    const remainingErrors = keys.reduce(
      (errors, key) => {
        delete errors[key];
        return errors;
      },
      { ...control.errors }
    );

    control.setErrors(remainingErrors);

    if (Object.keys(control.errors || {}).length === 0) {
      control.setErrors(null);
    }
  }

  public static addErrors(errors: { [key: string]: object }, control: AbstractControl) {
    if (!control || !errors) {
      return;
    }

    control.setErrors({ ...control.errors, ...errors });
  }
}
