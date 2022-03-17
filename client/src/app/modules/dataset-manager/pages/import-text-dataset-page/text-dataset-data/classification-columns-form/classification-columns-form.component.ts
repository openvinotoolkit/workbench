import { ChangeDetectionStrategy, Component, DoCheck, Input, OnDestroy, OnInit, Optional, Self } from '@angular/core';
import { ControlValueAccessor, FormControl, FormGroup, NgControl, Validators } from '@angular/forms';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { cloneDeep } from 'lodash';

import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';
import { ValidatorError } from '@shared/components/config-form-field/custom-validators';

import { uniqueColumnsGroupValidator } from '../entailment-columns-form/columns-form-group-validator';
import { IClassificationColumns } from '../../text-dataset-settings.model';

const formFields: {
  text: AdvancedConfigField;
  label: AdvancedConfigField;
} = {
  text: {
    type: 'select',
    label: 'Text Column',
    name: 'text',
    value: null,
    skipAutoDisableSelect: true,
    options: [],
    validators: [Validators.required],
    tooltip: {
      prefix: 'uploadTextDatasetPage',
      value: 'textColumn',
    },
  },
  label: {
    type: 'select',
    label: 'Label Column',
    name: 'label',
    value: null,
    skipAutoDisableSelect: true,
    options: [],
    validators: [Validators.required],
    tooltip: {
      prefix: 'uploadTextDatasetPage',
      value: 'labelColumn',
    },
  },
};

@Component({
  selector: 'wb-classification-columns-form',
  templateUrl: './classification-columns-form.component.html',
  styleUrls: ['./classification-columns-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationColumnsFormComponent implements OnInit, OnDestroy, DoCheck, ControlValueAccessor {
  @Input() set columnsNumber(value: number) {
    if (!value) {
      return;
    }

    const options = new Array(value).fill(null).map((_, i) => ({ name: (i + 1).toString(), value: i }));

    this.formFields[formFields.text.name].options = options;
    this.formFields[formFields.label.name].options = options;

    this.form.patchValue({
      [formFields.text.name]: 0,
      [formFields.label.name]: value > 1 ? 1 : null,
    });
  }

  readonly formFields = cloneDeep(formFields);

  readonly form = new FormGroup(
    {
      [formFields.label.name]: new FormControl(formFields.label.value, formFields.label?.validators),
      [formFields.text.name]: new FormControl(formFields.text.value, formFields.text?.validators),
    },
    { validators: uniqueColumnsGroupValidator }
  );

  private readonly _unsubscribe$ = new Subject<void>();

  private _onChange = (value: IClassificationColumns) => {};
  private _onTouched = () => {};

  constructor(@Self() @Optional() private controlDirective: NgControl) {
    if (this.controlDirective) {
      this.controlDirective.valueAccessor = this;
    }

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe(() => this.emit());
  }

  writeValue(): void {}

  registerOnChange(fn: (value: IClassificationColumns) => {}): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => {}): void {
    this._onTouched = fn;
  }

  ngOnInit() {
    this.controlDirective?.control.setValidators([this.validate.bind(this)]);
    this.emit();
  }

  ngDoCheck(): void {
    if (this.controlDirective?.touched) {
      this.form.markAllAsTouched();
    }
  }

  ngOnDestroy() {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  validate(): ValidatorError | null {
    return this.form.valid ? null : { columns: true };
  }

  emit() {
    const { label, text } = this.form.value;
    this._onChange({ label, text });
  }
}
