import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
  Validators,
} from '@angular/forms';

import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { isFinite, isString } from 'lodash';

import { channelPrefixesMap, ModelColorChannels, ModelDomain } from '@store/model-store/model.model';

import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';
import { CustomValidators } from '@shared/components/config-form-field/custom-validators';
import { FormUtils } from '@shared/utils/form-utils';

import { getUtilFieldsMap, InputLayerUtilFieldsMapType } from './input-layer-fields';

export interface InputLayerConfig {
  name: string;
  freezePlaceholderWithValue?: string;
  shape?: number[];
  means?: number[];
  scales?: number[];
}

@Component({
  selector: 'wb-input-output-layer-control',
  templateUrl: './input-output-layer-control.component.html',
  styleUrls: ['./input-output-layer-control.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputOutputLayerControlComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => InputOutputLayerControlComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputOutputLayerControlComponent implements OnInit, OnDestroy, ControlValueAccessor, Validator {
  @Input()
  public layerType: 'input' | 'output';

  @Input()
  public controlIndex: number;

  @Input()
  public controlsCount: number;

  @Input()
  public availableLayers: string[] = [];

  @Input() set colorSpace(value: string) {
    if (!value) {
      return;
    }
    if (value === ModelColorChannels.Grayscale) {
      this.channelPrefixes = channelPrefixesMap.Grayscale;
      return;
    }
    this.channelPrefixes = channelPrefixesMap.RGB;
  }

  @Input()
  public isDynamicSupported = false;

  @Input() set domain(value: ModelDomain) {
    if (value === ModelDomain.CV) {
      this._addCVDomainControls();
    } else {
      this._removeCVDomainControls();
    }
  }

  @Output()
  public removeInput: EventEmitter<number> = new EventEmitter<number>();

  public inputOutputLayerFormGroup: FormGroup;

  public channelPrefixes = channelPrefixesMap.RGB;

  public utilFormGroup: FormGroup;

  public layerNameFormControl = new FormControl(null, [Validators.required]);

  public defaultInputDimensionsCount = 4;

  public inputDimensionsCount: number = this.defaultInputDimensionsCount;

  public inputLayerUtilFieldsMap: InputLayerUtilFieldsMapType;

  public readonly controlNamesMap = {
    name: 'name',
    freezePlaceholderWithValue: 'freezePlaceholderWithValue',
    shape: 'shape',
    layout: 'layout',
    means: 'means',
    scales: 'scales',
  };

  private _unsubscribe$ = new Subject<void>();

  private _cvDomainSubscription: Subscription = null;

  constructor(private _fb: FormBuilder) {
    this.inputOutputLayerFormGroup = this._fb.group({
      [this.controlNamesMap.name]: this.layerNameFormControl,
    });

    this.inputOutputLayerFormGroup.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((values) => {
      if (this.isInputLayer() && !values.shape) {
        delete values.shape;
      }
      this.propagateChange(this.isInputLayer() ? values : values[this.controlNamesMap.name]);
    });

    this.utilFormGroup = this._fb.group({});
    this.inputLayerUtilFieldsMap = getUtilFieldsMap(Date.now()); // Ensure uniq util control names
  }

  ngOnInit() {
    if (!this.layerType) {
      throw Error('layerType is required input of InputOutputLayerControlComponent');
    }
    if (!isFinite(this.controlIndex)) {
      throw Error('controlIndex is required input of InputOutputLayerControlComponent');
    }

    if (!this.isInputLayer()) {
      return;
    }

    const utilFields = [
      this.inputLayerUtilFieldsMap.overrideShape,
      this.inputLayerUtilFieldsMap.useFreezePlaceholderWithValue,
    ];

    this.addControlsToUtilForm(utilFields);

    this.overrideInputShapesControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((overrideShape) => {
      if (overrideShape) {
        this.inputOutputLayerFormGroup.addControl(
          this.controlNamesMap.shape,
          this._fb.control(null, [
            Validators.required,
            CustomValidators.validateNumberArray(this.isDynamicSupported ? -1 : 0),
          ])
        );
        this.inputOutputLayerFormGroup.addControl(
          this.controlNamesMap.layout,
          this._fb.control(null, [Validators.required])
        );
      } else {
        this.inputOutputLayerFormGroup.removeControl(this.controlNamesMap.shape);
        this.inputOutputLayerFormGroup.removeControl(this.controlNamesMap.layout);
      }
    });

    this.useFreezePlaceholderWithValueControl.valueChanges
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((useFreezePlaceholder) => {
        if (useFreezePlaceholder) {
          this.inputOutputLayerFormGroup.addControl(
            this.controlNamesMap.freezePlaceholderWithValue,
            this._fb.control(null, [Validators.required, Validators.pattern('^[\\[\\]\\d .]+$|^False$|^True$')])
          );
        } else {
          this.inputOutputLayerFormGroup.removeControl(this.controlNamesMap.freezePlaceholderWithValue);
        }
      });
  }

  private _addCVDomainControls(): void {
    this._cvDomainSubscription?.unsubscribe();
    this.addControlsToUtilForm([this.inputLayerUtilFieldsMap.useMeans, this.inputLayerUtilFieldsMap.useScales]);

    this._cvDomainSubscription = this.useMeansInputShapesControl.valueChanges.subscribe((useMeans) => {
      if (useMeans) {
        this.inputOutputLayerFormGroup.addControl(
          this.controlNamesMap.means,
          this._fb.control(null, [Validators.required, CustomValidators.validateNumberArray(0)])
        );
      } else {
        this.inputOutputLayerFormGroup.removeControl(this.controlNamesMap.means);
      }
    });

    const subscription = this.useScalesInputShapesControl.valueChanges.subscribe((useScales) => {
      if (useScales) {
        this.inputOutputLayerFormGroup.addControl(
          this.controlNamesMap.scales,
          this._fb.control(null, [Validators.required, CustomValidators.validateNumberArray(0)])
        );
      } else {
        this.inputOutputLayerFormGroup.removeControl(this.controlNamesMap.scales);
      }
    });

    this._cvDomainSubscription.add(subscription);
  }

  private _removeCVDomainControls(): void {
    this._cvDomainSubscription?.unsubscribe();
    FormUtils.removeControlsFromForm(
      [this.inputLayerUtilFieldsMap.useScales, this.inputLayerUtilFieldsMap.useMeans],
      this.utilFormGroup
    );

    this.inputOutputLayerFormGroup.removeControl(this.controlNamesMap.means);
    this.inputOutputLayerFormGroup.removeControl(this.controlNamesMap.scales);
  }

  ngOnDestroy(): void {
    this._cvDomainSubscription?.unsubscribe();
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  get shapeControl(): AbstractControl {
    return this.inputOutputLayerFormGroup.get(this.controlNamesMap.shape);
  }

  get freezePlaceholderWithValueControl(): AbstractControl {
    return this.inputOutputLayerFormGroup.get(this.controlNamesMap.freezePlaceholderWithValue);
  }

  get meansControl(): AbstractControl {
    return this.inputOutputLayerFormGroup.get(this.controlNamesMap.means);
  }

  get scalesControl(): AbstractControl {
    return this.inputOutputLayerFormGroup.get(this.controlNamesMap.scales);
  }

  get overrideInputShapesControl(): AbstractControl {
    return this.utilFormGroup.get(this.inputLayerUtilFieldsMap.overrideShape.name);
  }

  get useFreezePlaceholderWithValueControl(): AbstractControl {
    return this.utilFormGroup.get(this.inputLayerUtilFieldsMap.useFreezePlaceholderWithValue.name);
  }

  get useMeansInputShapesControl(): AbstractControl {
    return this.utilFormGroup.get(this.inputLayerUtilFieldsMap.useMeans.name);
  }

  get useScalesInputShapesControl(): AbstractControl {
    return this.utilFormGroup.get(this.inputLayerUtilFieldsMap.useScales.name);
  }

  isInputLayer(): boolean {
    return this.layerType === 'input';
  }

  private addControlsToUtilForm(fields: AdvancedConfigField[] = []) {
    fields.forEach(({ name, value, validators }) => {
      this.utilFormGroup.addControl(name, this._fb.control(value, validators));
    });
  }

  propagateChange = (v: string | InputLayerConfig) => {};

  registerOnChange(fn: (v: string | InputLayerConfig) => void): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void): void {}

  writeValue(value: string | InputLayerConfig): void {
    if (!value) {
      return;
    }
    if (isString(value)) {
      this.inputOutputLayerFormGroup.setValue({ [this.controlNamesMap.name]: value });
      return;
    }
    const { means, scales, shape, freezePlaceholderWithValue } = value;
    if (shape) {
      this.overrideInputShapesControl.setValue(true);
      this.shapeControl.setValue(shape);
    } else {
      this.overrideInputShapesControl.setValue(false);
      delete value.shape;
    }
    if (means) {
      this.useMeansInputShapesControl.setValue(true);
      this.meansControl.setValue(means);
    }
    if (scales) {
      this.useScalesInputShapesControl.setValue(true);
      this.scalesControl.setValue(scales);
    }
    if (freezePlaceholderWithValue) {
      this.useFreezePlaceholderWithValueControl.setValue(true);
      this.freezePlaceholderWithValueControl.setValue(freezePlaceholderWithValue);
    }
    this.inputOutputLayerFormGroup.patchValue(value);
    this.inputOutputLayerFormGroup.updateValueAndValidity();
  }

  validate(control: AbstractControl): ValidationErrors | null {
    return this.inputOutputLayerFormGroup.valid
      ? null
      : {
          inputShapeRequiredError: true,
        };
  }
}
