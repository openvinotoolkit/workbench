import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { IInferenceResult } from '@store/inference-history-store/inference-history.model';

import { IInferenceConfiguration } from '@shared/models/compound-inference-config';

import { IInferenceMatrix } from '../../pages/inference-configuration-page/inference-configuration-page.component';

@Component({
  selector: 'wb-inference-matrix-select',
  templateUrl: './inference-matrix-select.component.html',
  styleUrls: ['./inference-matrix-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InferenceMatrixSelectComponent),
      multi: true,
    },
  ],
})
export class InferenceMatrixSelectComponent implements ControlValueAccessor {
  private _matrix: IInferenceMatrix = null;

  @Input()
  set matrix(value: IInferenceMatrix) {
    this._matrix = value;
    if (!value) {
      return;
    }
    this.unsetNotExistingValues();
  }

  get matrix(): IInferenceMatrix {
    return this._matrix;
  }

  inferenceExecInfoMap = new Map<string, IInferenceResult>();

  @Input() set inferenceExecInfo(values: IInferenceResult[]) {
    if (!values || !values.length) {
      return;
    }
    this.inferenceExecInfoMap.clear();
    values.forEach((value) => this.inferenceExecInfoMap.set(this.getResultKey(value), value));
  }

  selectedItems = new Map<string, IInferenceConfiguration>();

  private _touched = false;

  private onChange = (_: IInferenceConfiguration[]) => {};
  private onTouched = () => {};

  constructor(private cdr: ChangeDetectorRef) {}

  writeValue(values: IInferenceConfiguration[]): void {
    this.selectedItems.clear();
    values.forEach((value) => this.selectedItems.set(this.getConfigKey(value), value));
    this.cdr.detectChanges();
  }

  unsetNotExistingValues() {
    const selected = new Map();
    this.matrix.rows.forEach((row) =>
      row.forEach((cell) => {
        if (this.selectedItems.has(this.getConfigKey(cell))) {
          selected.set(this.getConfigKey(cell), cell);
        }
      })
    );
    this.selectedItems = selected;
    this.emit();
  }

  registerOnChange(fn: (_: IInferenceConfiguration[]) => void): void {
    if (!fn) {
      return;
    }

    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    if (!fn) {
      return;
    }

    this.onTouched = fn;
  }

  emit() {
    this.onChange(Array.from(this.selectedItems.values()));
    if (!this._touched) {
      this._touched = true;
      this.onTouched();
    }
  }

  toggleElement(element: IInferenceConfiguration): void {
    const key = this.getConfigKey(element);
    if (this.selectedItems.has(key)) {
      this.selectedItems.delete(key);
    } else {
      this.selectedItems.set(key, element);
    }

    this.emit();
  }

  getConfigKey(value: IInferenceConfiguration): string {
    return `${value.nireq}:${value.batch}`;
  }

  getResultKey(result: IInferenceResult): string {
    return `${result.nireq}:${result.batch}`;
  }
}
