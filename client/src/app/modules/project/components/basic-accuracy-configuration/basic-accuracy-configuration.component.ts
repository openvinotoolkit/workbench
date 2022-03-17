import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';

import { isEqual } from 'lodash';
import { Subject, Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { takeUntil } from 'rxjs/operators';

import { ModelItem, ModelTaskMethods, ModelTaskTypes } from '@store/model-store/model.model';
import { DatasetTypes } from '@store/dataset-store/dataset.model';
import { ModelStoreActions, RootStoreState } from '@store';
import { ProjectItem } from '@store/project-store/project.model';

import { SelectOption } from '@shared/components/config-form-field/config-form-field.component';

import { BasicAccuracyValidationFormHandler } from './form-handlers/basic-accuracy-validation-form-handler';

@Component({
  selector: 'wb-basic-accuracy-configuration',
  templateUrl: './basic-accuracy-configuration.component.html',
  styleUrls: ['./basic-accuracy-configuration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicAccuracyConfigurationComponent implements OnDestroy, OnChanges {
  @Input() model: ModelItem;

  @Input() datasetType: DatasetTypes;

  @Input() project: ProjectItem;

  @Output() usageChanged = new EventEmitter<ModelTaskTypes>();

  @Output() validityChanged = new EventEmitter<boolean>();

  formHandler: BasicAccuracyValidationFormHandler;

  modelTaskTypes = ModelTaskTypes;

  private _usageChangedSub: Subscription;

  private _unsubscribe$ = new Subject<void>();

  constructor(private store$: Store<RootStoreState.State>) {}

  ngOnDestroy() {
    this._usageChangedSub?.unsubscribe();
    this.formHandler?.destroy();
  }

  ngOnChanges({ model }: SimpleChanges) {
    if (!(model && model.currentValue) || isEqual(model.currentValue, model.previousValue)) {
      return;
    }

    this.buildHandler();
  }

  buildHandler() {
    this.formHandler?.destroy();
    this.formHandler = new BasicAccuracyValidationFormHandler(
      this.datasetType,
      this.model,
      this.model.accuracyConfiguration.taskType,
      this.model.accuracyConfiguration.taskMethod
    );
    this.formHandler.fields.taskType.options = (this.formHandler.fields.taskType.options as SelectOption[]).filter(
      (v) => v?.value !== ModelTaskTypes.CUSTOM
    );

    this.formHandler.fields.taskMethod.options = (this.formHandler.fields.taskMethod.options as SelectOption[]).filter(
      (v) => v?.value !== ModelTaskMethods.CUSTOM
    );

    this._usageChangedSub?.unsubscribe();
    this._usageChangedSub = this.formHandler.form.controls.taskType.valueChanges.subscribe((taskType: ModelTaskTypes) =>
      this.usageChanged.emit(taskType)
    );
    this.usageChanged.emit(this.formHandler.form.controls.taskType.value);

    this.formHandler.form.statusChanges
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(() => this.validityChanged.emit(this.formHandler.form.valid));
    this.validityChanged.emit(this.formHandler.form.valid);
  }

  public save(onSuccess?: () => void) {
    this.store$.dispatch(
      ModelStoreActions.updateAccuracyConfig({
        modelId: this.model.id,
        projectId: this.project.id,
        data: this.formHandler.getValue(),
        deleteRawAccuracy: this.project.hasRawAccuracyConfig,
        onSuccess,
      })
    );
  }
}
