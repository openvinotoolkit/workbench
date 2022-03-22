import { Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { reduce, omit } from 'lodash';

import { AdvancedConfigField, SelectOption } from '@shared/components/config-form-field/config-form-field.component';
import { CustomValidators } from '@shared/components/config-form-field/custom-validators';

import {
  LayoutTypeNamesByTypeMap,
  LayoutTypes,
} from '../../../modules/model-manager/components/model-manager-convert/input-output-layer-control/input-layer-fields';

export const layoutFieldNamesValuesMap = {
  N: 'Batch',
  C: 'Channels',
  W: 'Width',
  H: 'Height',
  D: 'Depth',
  S: 'Sequence',
  '?': 'Other',
};

@Component({
  selector: 'wb-dimensions-layouts',
  templateUrl: './dimensions-layouts.component.html',
  styleUrls: ['./dimensions-layouts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DimensionsLayoutsComponent implements OnInit, OnDestroy {
  @Input() index: number;

  @Input() removableFields: boolean;

  @Input() dimensionsCount: number;

  @Input() minDimensionValue = 0;

  @Input() parentGroup: FormGroup;

  public group: FormGroup;
  public readonly utilGroup: FormGroup = new FormGroup({});

  public isSpecifyLayout = false;

  public readonly dimensionField: AdvancedConfigField = {
    type: 'input',
    numberType: 'integer',
    name: 'dimension',
    value: '',
  };

  public readonly layoutField: AdvancedConfigField = {
    type: 'select',
    name: 'layout',
    options: reduce(layoutFieldNamesValuesMap, (options, name, value) => [...options, { name, value }], []),
    value: '',
  };

  public readonly inputProperties = {
    dimension: 'dimension',
    layout: 'layout',
  };

  public readonly defaultLayout = '?';

  public readonly maxDimensions = 5;

  public readonly LayoutTypes = LayoutTypes;

  public readonly layoutTypeField: AdvancedConfigField = {
    name: 'layoutType',
    type: 'radio',
    label: 'Original Layout',
    options: [],
    value: LayoutTypes.CUSTOM,
  };

  private readonly _layoutTypeByDimensionsCount = {
    2: [LayoutTypes.NC, LayoutTypes.CN],
    4: [LayoutTypes.NHWC, LayoutTypes.NCHW],
  };

  private readonly _batchDimensionKey = 'wrongBatchDimension';

  private readonly _unsubscribe$ = new Subject<void>();

  constructor(private _fb: FormBuilder) {
    const { name, value, validators } = this.layoutTypeField;
    this.utilGroup.addControl(name, this._fb.control(value, validators));

    this.group = this._fb.group({
      inputs: this._fb.array([]),
    });
  }

  ngOnInit(): void {
    this.group.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((formValues) => {
      const { inputs } = formValues;

      const dimensions = inputs.map(({ dimension }) => dimension);
      const layouts = inputs.map(({ layout }) => layout);

      if (this.parentGroup) {
        this.parentGroup.get('shape').setValue(dimensions);
        this.parentGroup.get('layout').setValue(layouts);
      }

      this.updateDimensions(inputs.length);
      this._updateShapeValidity(inputs);
    });

    this.layoutTypeControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((type) => {
      this.isSpecifyLayout = type === LayoutTypes.CUSTOM;

      if (type === this.utilGroup.value.layoutType) {
        return;
      }

      let layouts = [];

      switch (type) {
        case LayoutTypes.NC:
          layouts = ['N', 'C'];
          break;

        case LayoutTypes.CN:
          layouts = ['C', 'N'];
          break;

        case LayoutTypes.NHWC:
          layouts = ['N', 'H', 'W', 'C'];
          break;

        case LayoutTypes.NCHW:
          layouts = ['N', 'C', 'H', 'W'];
          break;

        case LayoutTypes.CUSTOM:
          layouts = ['N', '?', '?', '?'];
          break;
      }

      (this.group.get('inputs') as FormArray).controls.forEach((input, index) => {
        input.get('layout').setValue(layouts[index], { emitEvent: false });
      });

      this.parentGroup.get('layout').setValue(layouts);

      const inputs = this.group.value?.inputs;
      this._updateShapeValidity(inputs);
    });

    this.populate();
  }

  populate(): void {
    const dimensions = this.parentGroup?.get('shape').value;
    const layout = this.parentGroup?.get('layout').value;
    const inputsArray = this.getInputsArray(dimensions, layout);

    this.inputs.clear();

    inputsArray.forEach((input) => {
      const inputForm = this._getFormItem();

      inputForm.patchValue(input);

      this.inputs.push(inputForm);
    });

    if (!this.removableFields) {
      this.group.markAllAsTouched();
    }
  }

  getInputsArray(dimensions: number[], layouts: string[]): { dimension: number; layout: string }[] {
    if (!dimensions?.length) {
      dimensions = [...Array(this.dimensionsCount)];
    }

    return dimensions.map((dimension, index) => ({
      dimension,
      layout: (layouts?.length && layouts[index]) || this.defaultLayout,
    }));
  }

  addItem(): void {
    const inputForm = this._getFormItem();

    inputForm.patchValue({ layout: this.defaultLayout });

    this.inputs.push(inputForm);
    this.updateDimensions(this.inputs.length);
  }

  removeItem(index: number): void {
    this.inputs.removeAt(index);
    this.updateDimensions(this.inputs.length);
  }

  updateDimensions(dimensionsCount: number): void {
    const options = this.getLayoutTypeOptions(dimensionsCount);

    this.layoutTypeField.options = options;
    const currentType = this.layoutTypeControl.value;

    if (!options.find(({ value }) => value === currentType)) {
      this.layoutTypeControl.setValue(LayoutTypes.CUSTOM, { emitEvent: false });
    }
    options.length === 1 ? this.layoutTypeControl.disable() : this.layoutTypeControl.enable();
  }

  getLayoutTypeOptions(dimensionCount): SelectOption[] {
    const types = [...(this._layoutTypeByDimensionsCount[dimensionCount] || []), LayoutTypes.CUSTOM];

    return types.map((type) => ({ value: type, name: LayoutTypeNamesByTypeMap[type] }));
  }

  getLayoutValue(control): string {
    const layoutValue = control.value?.layout;

    return layoutValue ? layoutFieldNamesValuesMap[layoutValue] : '';
  }

  get inputs(): FormArray {
    return this.group.controls['inputs'] as FormArray;
  }

  get layoutTypeControl(): AbstractControl {
    return this.utilGroup.get(this.layoutTypeField.name);
  }

  private _getFormItem(): FormGroup {
    return this._fb.group({
      [this.inputProperties.dimension]: this._fb.control(null, [
        Validators.required,
        CustomValidators.dimension(this.minDimensionValue === -1),
      ]),
      [this.inputProperties.layout]: this._fb.control(null, [Validators.required]),
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  get isValidationMessageVisible(): boolean {
    return this.group.touched && this.group.invalid;
  }

  private _updateShapeValidity(inputs: { layout: string; dimension: number }[]): void {
    inputs?.forEach(({ layout, dimension }, index) => {
      const dimensionControl = (this.group?.get('inputs') as FormArray).at(index).get('dimension');
      let errors = dimensionControl.errors;

      errors = omit(errors, this._batchDimensionKey);

      if (!Object.keys(errors).length) {
        errors = null;
      }

      if (layout === 'N' && dimension < 1) {
        errors = errors || {};
        errors[this._batchDimensionKey] = { message: 'Batch shape must be > 0' };
      }

      dimensionControl?.setErrors(errors);
    });
  }
}
