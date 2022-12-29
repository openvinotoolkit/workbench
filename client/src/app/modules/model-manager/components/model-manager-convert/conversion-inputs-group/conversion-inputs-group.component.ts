import { ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';

import { isNil, map, range, uniq, without } from 'lodash';
import { filter, first, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Store } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';

import { ModelColorChannels, ModelConvertConfig, ModelItem } from '@store/model-store/model.model';
import { GlobalsStoreSelectors, RootStoreState } from '@store';
import { SupportedFeaturesPreview } from '@store/globals-store/globals.state';

import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';
import { FormUtils } from '@shared/utils/form-utils';
import { CustomValidators } from '@shared/components/config-form-field/custom-validators';

import { isTfModel, isTFObjectDetectionAPI } from '../model-helpers';

@Component({
  selector: 'wb-conversion-inputs-group',
  templateUrl: './conversion-inputs-group.component.html',
  styleUrls: ['./conversion-inputs-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversionInputsGroupComponent implements OnChanges, OnDestroy {
  @Input()
  model: ModelItem;

  @Input()
  parentGroup: UntypedFormGroup;

  @Input()
  colorSpace: ModelColorChannels;

  public specifyInputs: AdvancedConfigField = {
    name: 'specifyInputs',
    label: 'Specify Inputs (Optional)',
    type: 'checkbox',
    value: false,
  };

  public isVisibleNote = false;

  public readonly group = new UntypedFormGroup({});

  public readonly inputLayers = 'inputs';

  public readonly inputSpecification = this._messagesService.hintMessages.conversionTips.inputSpecification;
  public readonly inputDynamicDimensionNote =
    this._messagesService.hintMessages.conversionTips.inputDynamicDimensionNote;
  readonly neededBatchMessage = this._messagesService.hintMessages.conversionTips.neededBatch;

  public isDynamicSupported = false;

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    private store$: Store<RootStoreState.State>,
    private fb: UntypedFormBuilder,
    private readonly _messagesService: MessagesService
  ) {
    this.store$
      .select(GlobalsStoreSelectors.selectIsFeaturePreviewSupported(SupportedFeaturesPreview.DYNAMIC_SHAPES))
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((supported) => (this.isDynamicSupported = supported));

    this.build();

    this.specifyInputsControl.valueChanges
      .pipe(
        filter((checked) => checked),
        first()
      )
      .subscribe(() => {
        this.isVisibleNote = true;
        this.fillFromModelAnalyzer();
      });

    this.specifyInputsControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((isSpecified) => {
      if (!this.parentGroup) {
        return;
      }

      if (isSpecified) {
        this.parentGroup.addControl('inputs', this.group);
      } else {
        this.parentGroup.removeControl('inputs');
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { model } = changes;

    if (!model?.currentValue) {
      return;
    }

    this.build();
  }

  build(): void {
    this.inputLayersFormArray = this.fb.array([]);
    FormUtils.addControlsToForm([this.specifyInputs], this.group);

    this.populate();
  }

  populate(): void {
    const params = this.model?.mo?.params;

    if (params) {
      this.populateInputsWithValues(params);
    }
  }

  populateInputsWithValues(config: ModelConvertConfig): void {
    const { inputs } = config;

    if (!inputs?.length) {
      return;
    }

    this.specifyInputsControl.setValue(true);
    this.inputLayersFormArray = this.fb.array([], [CustomValidators.requiredBatch, CustomValidators.validateBatch]);
    this.addInputLayerControl(inputs.length || 1);

    // TODO: path value only when inputs was specified
    this.group.patchValue({ inputs });
  }

  get inputLayersFormArray(): UntypedFormArray {
    return this.group.get(this.inputLayers) as UntypedFormArray;
  }

  set inputLayersFormArray(formArray: UntypedFormArray) {
    this.group.setControl(this.inputLayers, formArray);
  }

  addInputLayerControl(controlsCount: number = 1): void {
    range(controlsCount).forEach(() => {
      this.inputLayersFormArray.push(this.fb.control(null));
    });
  }

  getAvailableLayersForInputControl(controlIndex: number): string[] {
    const inputLayers = Object.keys(this.model.mo?.analyzedParams?.inputs || {});
    const intermediateLayers = this.model?.mo?.analyzedParams?.intermediate || [];

    const selectedLayerName = this.inputLayersFormArray.at(controlIndex).value?.name;
    const otherSelectedInputLayers = without(map(this.inputLayersFormArray.getRawValue(), 'name'), selectedLayerName);

    return without(uniq([...inputLayers, ...intermediateLayers]), ...otherSelectedInputLayers);
  }

  removeInputLayerControl(controlIndex: number): void {
    this.inputLayersFormArray.removeAt(controlIndex);
  }

  clearShapes(): void {
    this.inputLayersFormArray.controls.forEach((control: AbstractControl) => {
      control.patchValue({ name: control.value?.name, shape: null });
    });
  }

  fillFromModelAnalyzer(): void {
    const moData = this.model?.mo;

    if (moData?.analyzedParams) {
      const convertFormValues = moData?.params ? { ...moData.params } : {};
      const { inputs } = moData.analyzedParams;

      convertFormValues.inputs = map(inputs, ({ shape }, name) => ({
        name,
        shape: !this.isTfModel && isNil(shape) ? [] : shape,
      }));
      if (this.isTFObjectDetectionAPI) {
        // Reset shape value to unset "override shape" control
        convertFormValues.inputs.forEach((input, i) => {
          delete convertFormValues.inputs[i].shape;
        });
      }
      this.populateInputsWithValues(convertFormValues);
    }
  }

  get specifyInputsControl(): AbstractControl {
    return this.group.get(this.specifyInputs.name);
  }

  get isTfModel(): boolean {
    return isTfModel(this.model);
  }

  get isTFObjectDetectionAPI(): boolean {
    return isTFObjectDetectionAPI(this.model);
  }
}
