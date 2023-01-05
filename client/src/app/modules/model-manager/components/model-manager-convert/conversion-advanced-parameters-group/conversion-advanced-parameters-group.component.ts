import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';

import { range, isEmpty } from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ModelItem } from '@store/model-store/model.model';

import { FormUtils } from '@shared/utils/form-utils';
import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';

import { isTfModel } from '../model-helpers';

@Component({
  selector: 'wb-conversion-advanced-parameters-group',
  templateUrl: './conversion-advanced-parameters-group.component.html',
  styleUrls: ['./conversion-advanced-parameters-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversionAdvancedParametersGroupComponent implements OnChanges, OnDestroy {
  @Input()
  model: ModelItem;

  @Input()
  parentGroup: UntypedFormGroup;

  public readonly useOutputs: AdvancedConfigField = {
    name: 'useOutputs',
    label: 'Override Outputs',
    type: 'checkbox',
    value: false,
    tooltip: {
      prefix: 'convertModel',
      value: 'output',
    },
  };
  public readonly outputLayers = 'outputs';

  public group = new UntypedFormGroup({});
  public utilGroup = new UntypedFormGroup({});

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(private fb: UntypedFormBuilder) {
    this.build();

    this.useOutputsControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((useOutputs) => {
      if (useOutputs) {
        this.group.addControl(this.outputLayers, this.fb.array([this.fb.control(null)]));
      } else {
        this.group.removeControl(this.outputLayers);
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { model } = changes;

    if (!model.currentValue) {
      return;
    }

    if (this.parentGroup) {
      this.parentGroup.addControl('advanced', this.group);
    }

    this.build();
  }

  build(): void {
    FormUtils.addControlsToForm([this.useOutputs], this.utilGroup);

    this.populate();
  }

  populate(): void {
    if (!this.model) {
      return;
    }

    const config = this.model.mo?.params || {};
    const { outputs } = config;

    this.useOutputsControl.setValue(Boolean(outputs?.length));
    if (outputs) {
      this.outputLayersFormArray = this.fb.array([]);
      this.addOutputLayerControl(outputs.length);
    }

    if (isEmpty(config)) {
      return;
    }

    this.group.patchValue({
      originalLayout: config.originalLayout,
      outputs: config.outputs,
    });
  }

  get useOutputsControl(): AbstractControl {
    return this.utilGroup.get(this.useOutputs.name);
  }

  get outputLayersFormArray(): UntypedFormArray {
    return this.group.get(this.outputLayers) as UntypedFormArray;
  }

  set outputLayersFormArray(formArray: UntypedFormArray) {
    this.group.setControl(this.outputLayers, formArray);
  }

  addOutputLayerControl(controlsCount: number = 1): void {
    range(controlsCount).forEach(() => {
      this.outputLayersFormArray.push(this.fb.control(null));
    });
  }

  removeOutputLayerControl(controlIndex: number): void {
    this.outputLayersFormArray.removeAt(controlIndex);
  }

  isTfModel(): boolean {
    return isTfModel(this.model);
  }
}
