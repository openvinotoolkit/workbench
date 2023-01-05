import { ChangeDetectionStrategy, Component, DoCheck, Input, OnDestroy, OnInit, Optional, Self } from '@angular/core';
import { ControlValueAccessor, UntypedFormControl, UntypedFormGroup, NgControl, Validators } from '@angular/forms';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { cloneDeep } from 'lodash';

import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';
import { ValidatorError } from '@shared/components/config-form-field/custom-validators';

import { uniqueColumnsGroupValidator } from './columns-form-group-validator';
import { IEntailmentColumns } from '../../text-dataset-settings.model';

const formFields: {
  premise: AdvancedConfigField;
  hypothesis: AdvancedConfigField;
  label: AdvancedConfigField;
} = {
  premise: {
    type: 'select',
    label: 'Premise Column',
    name: 'premise',
    value: null,
    skipAutoDisableSelect: true,
    options: [],
    validators: [Validators.required],
    tooltip: {
      prefix: 'uploadTextDatasetPage',
      value: 'premiseColumn',
    },
  },
  hypothesis: {
    type: 'select',
    label: 'Hypothesis Column',
    name: 'hypothesis',
    value: null,
    skipAutoDisableSelect: true,
    options: [],
    validators: [Validators.required],
    tooltip: {
      prefix: 'uploadTextDatasetPage',
      value: 'hypothesisColumn',
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
  selector: 'wb-entailment-columns-form',
  templateUrl: './entailment-columns-form.component.html',
  styleUrls: ['./entailment-columns-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntailmentColumnsFormComponent implements OnDestroy, OnInit, DoCheck, ControlValueAccessor {
  @Input() set columnsNumber(value: number) {
    if (!value) {
      return;
    }

    const options = new Array(value).fill(null).map((_, i) => ({ name: (i + 1).toString(), value: i }));

    this.formFields[formFields.premise.name].options = options;
    this.formFields[formFields.hypothesis.name].options = options;
    this.formFields[formFields.label.name].options = options;

    this.form.patchValue({
      [formFields.premise.name]: 0,
      [formFields.hypothesis.name]: value > 1 ? 1 : null,
      [formFields.label.name]: value > 2 ? 2 : null,
    });
  }

  readonly formFields = cloneDeep(formFields);

  readonly form = new UntypedFormGroup(
    {
      [formFields.premise.name]: new UntypedFormControl(formFields.premise.value, formFields.premise?.validators),
      [formFields.hypothesis.name]: new UntypedFormControl(
        formFields.hypothesis.value,
        formFields.hypothesis?.validators
      ),
      [formFields.label.name]: new UntypedFormControl(formFields.label.value, formFields.label?.validators),
    },
    { validators: uniqueColumnsGroupValidator }
  );

  private readonly _unsubscribe$ = new Subject<void>();

  private _onChange = (value: IEntailmentColumns) => {};
  private _onTouched = () => {};

  constructor(@Self() @Optional() private controlDirective: NgControl) {
    if (this.controlDirective) {
      this.controlDirective.valueAccessor = this;
    }

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe(() => this.emit());
  }

  writeValue(): void {}

  registerOnChange(fn: (value: IEntailmentColumns) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
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
    const { label, premise, hypothesis } = this.form.value;
    this._onChange({ label, premise, hypothesis });
  }
}
