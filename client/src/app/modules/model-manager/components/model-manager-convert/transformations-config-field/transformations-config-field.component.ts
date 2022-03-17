import { Component, ChangeDetectionStrategy, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, ValidatorFn } from '@angular/forms';

import { TransformationsConfig } from '@store/model-store/model.model';

export interface TransformationsConfigField {
  name: string;
  value?: string | null;
  options: { name: string; documentation?: string }[];
  validators?: ValidatorFn[];
}

@Component({
  selector: 'wb-transformations-config-field',
  templateUrl: './transformations-config-field.component.html',
  styleUrls: ['./transformations-config-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransformationsConfigFieldComponent {
  @Input()
  field: TransformationsConfigField;

  @Input()
  group: FormGroup;

  @Input()
  testId: string;

  constructor(private cdr: ChangeDetectorRef) {}

  setSimilarConfig(configs: TransformationsConfig[], path: string): void {
    const config = configs?.find((item) => path.includes(item.name));
    if (config) {
      this.updateConfigValue(config.name);
    }
  }

  updateConfigValue(value: string): void {
    this.group.get(this.field.name).setValue(value);
    this.cdr.detectChanges();
  }

  getError(): string {
    const control = this.group.get(this.field.name);

    if (control.hasError('required')) {
      return 'This field is required';
    }
  }
}
