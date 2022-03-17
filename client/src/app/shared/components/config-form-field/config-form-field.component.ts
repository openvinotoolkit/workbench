import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';

import { isObject } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';

const RGBValidators = [Validators.required, Validators.min(0), Validators.max(256)];

export interface SelectOption {
  name: string;
  value: string | number | boolean | null;
  disabled?: boolean;
}

export interface AdvancedConfigField {
  type: 'input' | 'select' | 'checkbox' | 'RGB' | 'text' | 'password' | 'threshold' | 'radio';
  name: string;
  label?: string;
  value?: string | number | boolean | number[] | null;
  disabled?: boolean;
  skipAutoDisableSelect?: boolean;
  options?: SelectOption[] | string[] | number[];
  numberType?: 'float' | 'integer' | 'long_float';
  maxNumber?: number;
  validators?: ValidatorFn[];
  suffix?: string;
  tooltip?: Tooltip;
  hidden?: boolean;
}

interface Tooltip {
  prefix: string;
  value: string;
}

@Component({
  selector: 'wb-config-form-field',
  templateUrl: './config-form-field.component.html',
  styleUrls: ['./config-form-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigFormFieldComponent implements OnInit, OnDestroy {
  @Input() field: AdvancedConfigField;

  @Input() group: FormGroup;

  @Input() idSuffix: string;

  @Input() testId: string;

  @Input() autoDisableSelect = true;

  rgbFormGroup: FormGroup;
  isObject = isObject;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    public tooltipService: MessagesService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.field.type === 'RGB') {
      const { value } = this.field;
      const [R, G, B] = value as number[];
      this.rgbFormGroup = this.formBuilder.group({
        R: new FormControl(R, RGBValidators),
        G: new FormControl(G, RGBValidators),
        B: new FormControl(B, RGBValidators),
      });
    }

    // Disable select dropdown for single option input
    if (
      this.field &&
      this.field.type === 'select' &&
      !this.field.skipAutoDisableSelect &&
      (!this.field.options || this.field.options.length === 1)
    ) {
      this.group.controls[this.field.name].disable();
    }

    this.group.controls[this.field.name].statusChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => this._cdr.detectChanges());
  }

  updateRGBFieldValue() {
    const { R, G, B } = this.rgbFormGroup.getRawValue();
    this.group.controls[this.field.name].setValue([R, G, B]);
    this.group.markAsDirty();
  }

  getError() {
    const control = this.group.get([this.field.name]);
    // TODO Remove field specific errors outside of component
    if (control.hasError('required')) {
      return 'This field is required';
    } else if (control.hasError('max')) {
      const error = control.errors.max;
      return `Actual value (${error.actual}) exceeds maximum (${error.max})`;
    } else if (control.hasError('min')) {
      const error = control.errors.min;
      return `Actual value (${error.actual}) is below minimum (${error.min})`;
    } else if (control.hasError('step')) {
      const error = control.errors.step;
      return `Number of steps (${error.step}) should be lower than max - min `;
    } else if (control.hasError('range')) {
      return `Minimum value should not be greater than maximum `;
    } else if (control.hasError('pattern')) {
      return `Value should be integer`;
    } else if (control.hasError('nameUnsafeCharacters')) {
      return control.getError('nameUnsafeCharacters').message;
    } else if (control.hasError('unique')) {
      return control.getError('unique').message;
    } else if (control.hasError('wrongDimension')) {
      return control.getError('wrongDimension').message;
    } else if (control.hasError('invalidSeparator')) {
      return control.getError('invalidSeparator').message;
    }
  }

  shouldDisplayErrorMessage(fieldName: string): boolean {
    return this.group?.controls[fieldName]?.invalid && this.group?.controls[fieldName]?.touched;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  get controlId(): string {
    return this.idSuffix ? `${this.field.name}-${this.idSuffix}` : this.field.name;
  }

  getOptionId(option): string {
    return isObject(option) ? option['name'] + this.idSuffix : option + this.idSuffix;
  }
}
