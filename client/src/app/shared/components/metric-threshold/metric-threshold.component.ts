import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, Optional, Self } from '@angular/core';
import { AbstractControl, ControlValueAccessor, FormControl, FormGroup, NgControl, Validators } from '@angular/forms';

import { takeUntil } from 'rxjs/operators';
import { merge, Subject } from 'rxjs';
import { isNumber, round } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';

import { ValidatorError } from '@shared/components/config-form-field/custom-validators';

const startValueValidator = (control: AbstractControl): ValidatorError | null => {
  if (!isNumber(control.value) || !control.parent) {
    return null;
  }
  const start = control.value;
  const end = control.parent.value.end;

  if (start > end) {
    return { max: { actual: start, max: end } };
  }

  return null;
};

const stepValueValidator = (control: AbstractControl): ValidatorError | null => {
  if (!isNumber(control.value) || !control.parent) {
    return null;
  }
  const step = control.value;
  const { start, end } = control.parent.value;

  if (step > round(end - start, 2)) {
    return { max: { actual: step, max: Math.max(round(end - start, 2), 0) } };
  }

  return null;
};

const endValueValidator = (control: AbstractControl): ValidatorError | null => {
  if (!isNumber(control.value) || !control.parent) {
    return null;
  }
  const end = control.value;
  const start = control.parent.value.start;

  if (start > end) {
    return { min: { actual: end, min: start } };
  }

  return null;
};

@Component({
  selector: 'wb-metric-threshold',
  templateUrl: './metric-threshold.component.html',
  styleUrls: ['./metric-threshold.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricThresholdComponent implements OnInit, ControlValueAccessor, OnDestroy {
  form: FormGroup = null;

  constructor(@Self() @Optional() private controlDirective: NgControl, public tooltipService: MessagesService) {
    if (!this.controlDirective) {
      return;
    }
    this.controlDirective.valueAccessor = this;
    this.createForm();
  }

  private _touched = false;

  private _unsubscribe$ = new Subject();

  private onChange = (_) => {};
  private onTouched = () => {};

  ngOnInit() {
    if (!this.controlDirective) {
      return;
    }
    this.controlDirective.control.setValidators([this.validate.bind(this)]);
    this.controlDirective.control.updateValueAndValidity();
  }

  ngOnDestroy() {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  writeValue(value: string): void {
    const [start, step, end] = value.split(':');
    this.form.patchValue({
      start: Number(start),
      step: Number(step),
      end: Number(end),
    });
  }

  registerOnChange(fn: () => {}): void {
    if (!fn) {
      return;
    }

    this.onChange = fn;
  }

  registerOnTouched(fn: () => {}): void {
    if (!fn) {
      return;
    }

    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    if (isDisabled) {
      this.form.disable();
    } else {
      this.form.enable();
    }
  }

  validate(): ValidatorError | null {
    return this.form.valid ? null : { threshold: true };
  }

  createForm() {
    this.form = new FormGroup({
      start: new FormControl(null, [Validators.required, Validators.min(0), Validators.max(1), startValueValidator]),
      step: new FormControl(null, [Validators.required, Validators.min(0), Validators.max(1), stepValueValidator]),
      end: new FormControl(null, [Validators.required, Validators.min(0), Validators.max(1), endValueValidator]),
    });

    this.form.markAllAsTouched();

    this.form.valueChanges.pipe(takeUntil(merge(this._unsubscribe$))).subscribe(() => {
      Object.values(this.form.controls).forEach((control) => control.updateValueAndValidity({ emitEvent: false }));
      this.emit();
    });
  }

  emit() {
    if (!this.form.valid) {
      if (this.controlDirective.control) {
        this.controlDirective.control.updateValueAndValidity();
      }
      return;
    }

    const { start, step, end } = this.form.value;
    this.onChange(this.toAccuracyCheckerFormat(start, step, end));
    if (!this._touched) {
      this._touched = true;
      this.onTouched();
    }
  }

  /**
   * Accuracy checker threshold format '.50:.05:.95'
   * @param start
   * @param step
   * @param end
   */
  toAccuracyCheckerFormat(start: number, step: number, end: number): string {
    const format = (value: number): string => {
      if (value > 1) {
        throw new Error('Accuracy checker threshold parameter cannot be greater than 1');
      }
      return value.toFixed(2).slice(1);
    };
    return `${format(start)}:${format(step)}:${format(end)}`;
  }

  getError(control): string {
    if (control.hasError('required')) {
      return 'This field is required';
    } else if (control.hasError('max')) {
      const error = control.errors.max;
      return `Actual value (${error.actual}) exceeds maximum (${error.max})`;
    } else if (control.hasError('min')) {
      const error = control.errors.min;
      return `Actual value (${error.actual}) is below minimum (${error.min})`;
    }
  }
}
