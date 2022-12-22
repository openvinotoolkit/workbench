import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

import { range, without, values, get, isEmpty, isEqual } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { channelPrefixesMap } from '@store/model-store/model.model';

const inputDefaults = {
  dimensionsCount: 2,
  removableFields: false,
};

const dimensionControlNamePrefix = 'input-dimension-';

@Component({
  selector: 'wb-dimensions-input',
  templateUrl: './dimensions-input.component.html',
  styleUrls: ['./dimensions-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DimensionsInputComponent implements OnInit, OnDestroy {
  public maxDimensionFields = 5;

  @Input()
  public dimensionsCount: number;

  @Output()
  public dimensionsCountChange: EventEmitter<number> = new EventEmitter<number>();

  @Input()
  public removableFields: boolean;

  @Input()
  public initialInputValues: number[];

  @Input() set inputPrefixes(value: string[]) {
    this._inputPrefixes = value;
    this.setDimensionFields();
  }
  get inputPrefixes(): string[] {
    return this._inputPrefixes;
  }
  private _inputPrefixes: string[] = [];

  @Input()
  public minDimensionValue = 0;

  @Output()
  public changeInputValues: EventEmitter<number[]> = new EventEmitter<number[]>();

  public dimensionFields: number[] = [];

  public dimensionsFormGroup: UntypedFormGroup;

  public dimensionsInputNumberType = 'integer';

  public validators = [];

  private _unsubscribe$ = new Subject<void>();

  constructor(private fb: UntypedFormBuilder) {
    this.dimensionsFormGroup = this.fb.group({});
    this.dimensionsFormGroup.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((formValues) => {
      this.changeInputValues.emit(values(formValues));
    });
  }

  ngOnInit() {
    this.validators.push(Validators.required, Validators.min(this.minDimensionValue));

    if (
      isEqual(this.inputPrefixes, channelPrefixesMap.RGB) ||
      isEqual(this.inputPrefixes, channelPrefixesMap.Grayscale)
    ) {
      this.dimensionsInputNumberType = 'long_float';
    }
    if (!this.dimensionsCount) {
      this.dimensionsCount = inputDefaults.dimensionsCount;
    }
    if (!this.removableFields) {
      this.removableFields = inputDefaults.removableFields;
    }
    if (!isEmpty(this.initialInputValues)) {
      this.dimensionsCount = this.initialInputValues.length;
    }
    this.setDimensionFields();
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  setDimensionFields(): void {
    Object.keys(this.dimensionsFormGroup.controls).forEach((controlKey) => {
      this.dimensionsFormGroup.removeControl(controlKey);
    });
    this.dimensionFields = range(1, this.dimensionsCount + 1);
    this.dimensionFields.forEach((index, i) => {
      const initialValue = get(this.initialInputValues, i, null);

      const control = this.fb.control(initialValue, this.validators);
      this.dimensionsFormGroup.addControl(`${dimensionControlNamePrefix}${index}`, control);
    });
  }

  addDimensionField(): void {
    if (this.dimensionsCount === this.maxDimensionFields) {
      return;
    }
    const newFieldsIndex = Math.max(...this.dimensionFields) + 1;
    this.dimensionFields.push(newFieldsIndex);
    this.dimensionsFormGroup.addControl(
      dimensionControlNamePrefix + newFieldsIndex,
      this.fb.control(null, this.validators)
    );
    this.dimensionsCount++;
    this.dimensionsCountChange.emit(this.dimensionsCount);
  }

  removeDimensionField(fieldIndex: number): void {
    if (this.dimensionFields.length === 1) {
      return;
    }
    this.dimensionFields = without<number>(this.dimensionFields, fieldIndex);
    this.dimensionsFormGroup.removeControl(dimensionControlNamePrefix + fieldIndex);
    this.dimensionsCount--;
    this.dimensionsCountChange.emit(this.dimensionsCount);
  }
}
