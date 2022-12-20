import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

import { Store } from '@ngrx/store';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { MessagesService } from '@core/services/common/messages.service';

import * as ModelsSelector from '@store/model-store/model.selectors';
import { ModelItem, ModelShape, ShapeType } from '@store/model-store/model.model';
import { ModelStoreActions } from '@store';

import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';
import { CustomValidators } from '@shared/components/config-form-field/custom-validators';

@Component({
  selector: 'wb-reshape',
  templateUrl: './reshape.component.html',
  styleUrls: ['./reshape.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReshapeComponent implements OnDestroy {
  public _importingModel: Partial<ModelItem>;
  @Input() set importingModel(value: Partial<ModelItem>) {
    this._importingModel = value;

    if (this._importingModel?.shapes?.length) {
      this.modelOriginalShapeData = this._importingModel.shapes.find(({ isOriginal }) => isOriginal);

      this.populate();
    }
  }

  @Input()
  isNLPModel: boolean;

  get importingModel(): Partial<ModelItem> {
    return this._importingModel;
  }

  @Output()
  public readonly cancel: EventEmitter<void> = new EventEmitter<void>();

  public readonly conversionTips = this._messagesService.hintMessages.conversionTips;
  public readonly reshapePipeline$ = this._store$.select(ModelsSelector.selectRunningConfigurePipeline);
  public readonly error$ = this._store$.select(ModelsSelector.selectModelError);

  public group: UntypedFormGroup;

  public readonly inputProperties = {
    index: 'index',
    name: 'name',
    shape: 'shape',
    layout: 'layout',
  };
  public modelOriginalShapeData: ModelShape;

  public dimensionsCount = 4;

  public readonly inputIndexField: AdvancedConfigField = {
    type: 'input',
    name: 'index',
    value: '',
  };

  public readonly inputNameField: AdvancedConfigField = {
    type: 'text',
    name: 'name',
    value: '',
  };

  public readonly shapeTypes = ShapeType;

  // FIXME: Availability of dynamic shape should depend on model type. In some case this page should be allow
  //  set only static type
  public formType = ShapeType.STATIC;

  public denySave = false;

  private readonly _unsubscribe$ = new Subject<void>();

  constructor(private _store$: Store, private _messagesService: MessagesService, private _fb: UntypedFormBuilder) {
    this.group = this._fb.group({
      inputs: this._fb.array([]),
    });

    this.reshapePipeline$.pipe(takeUntil(this._unsubscribe$)).subscribe((pipeline) => {
      this.denySave = !!pipeline;
    });
  }

  populate(): void {
    if (!this.modelOriginalShapeData) {
      return;
    }

    this.group = this._fb.group({
      inputs: this._fb.array([], [CustomValidators.requiredBatch, CustomValidators.validateBatch]),
    });

    this.modelOriginalShapeData.shapeConfiguration.forEach((input) => {
      const inputForm = this._fb.group({
        [this.inputProperties.name]: this._fb.control(null, [Validators.required]),
        [this.inputProperties.index]: this._fb.control(null),
        [this.inputProperties.shape]: this._fb.control(null, [
          Validators.required,
          CustomValidators.validateNumberArray(this.isDynamicAllowed ? -1 : 0),
        ]),
        [this.inputProperties.layout]: this._fb.control(null, [Validators.required]),
      });

      inputForm.patchValue(input);

      this.inputs.push(inputForm);
    });
  }

  get inputs(): UntypedFormArray {
    return this.group.controls['inputs'] as UntypedFormArray;
  }

  save(): void {
    this.denySave = true;

    const inputsByLayer = this.group.value.inputs;

    this._store$.dispatch(
      ModelStoreActions.configureModel({ modelId: this.importingModel.id, inputsConfigurations: inputsByLayer })
    );
  }

  getShapeControl(index: number): AbstractControl {
    const inputs = this.group.get('inputs') as UntypedFormArray;

    return inputs.at(index).get(this.inputProperties.shape);
  }

  getLayoutControl(index: number): AbstractControl {
    const inputs = this.group.get('inputs') as UntypedFormArray;

    return inputs.at(index).get(this.inputProperties.layout);
  }

  getDimensionsCount(index): number {
    return this.modelOriginalShapeData.shapeConfiguration[index]?.shape?.length || 0;
  }

  get isDynamicAllowed(): boolean {
    return this.formType === this.shapeTypes.DYNAMIC;
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }
}
