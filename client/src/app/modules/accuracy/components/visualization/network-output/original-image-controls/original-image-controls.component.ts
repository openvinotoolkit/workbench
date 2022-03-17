import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';

import { ModelTaskTypes } from '@store/model-store/model.model';

import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';
import { FormUtils } from '@shared/utils/form-utils';

import { PaintingCanvasManagerService } from '../painting-canvas-manager.service';

export enum VisualizationType {
  DEFAULT = 'default',
  EXPLAIN = 'explain',
  PARENT_MODEL_PREDICTIONS = 'ref_visualization',
}

export const VisualizationOptionsNamesMap = {
  [VisualizationType.DEFAULT]: 'Model Predictions',
  [VisualizationType.EXPLAIN]: 'Model Predictions with Importance Map',
  [VisualizationType.PARENT_MODEL_PREDICTIONS]: 'Optimized and Parent Model Predictions',
};

@Component({
  selector: 'wb-original-image-controls',
  templateUrl: './original-image-controls.component.html',
  styleUrls: ['./original-image-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OriginalImageControlsComponent implements OnInit, OnDestroy {
  @Input() disabled = false;
  @Input() imageSelected = false;
  @Input() acceptedMimeTypes: string = null;

  private _parentModelVisualizationAvailable: boolean;
  @Input() set parentModelVisualizationAvailable(value: boolean) {
    this._parentModelVisualizationAvailable = value;
    this.visualizationOptions[VisualizationType.PARENT_MODEL_PREDICTIONS].disabled = !value;
    this.visualizationOptionsForm.controls[this.visualizationOptionsField.name].setValue(VisualizationType.DEFAULT);
  }

  get parentModelVisualizationAvailable(): boolean {
    return this._parentModelVisualizationAvailable;
  }

  private _taskType: ModelTaskTypes = null;
  @Input() set taskType(value: ModelTaskTypes) {
    this._taskType = value;
    this.visualizationOptions[VisualizationType.EXPLAIN].disabled = value !== ModelTaskTypes.CLASSIFICATION;
    this.visualizationOptionsForm.controls[this.visualizationOptionsField.name].setValue(VisualizationType.DEFAULT);
  }

  get taskType(): ModelTaskTypes {
    return this._taskType;
  }

  @Output() test = new EventEmitter<{ visualizationType: VisualizationType }>();
  @Output() file = new EventEmitter<File>();

  public visualizationOptionsForm: FormGroup;

  readonly visualizationOptions = {
    [VisualizationType.DEFAULT]: {
      value: VisualizationType.DEFAULT,
      name: VisualizationOptionsNamesMap[VisualizationType.DEFAULT],
      disabled: false,
    },
    [VisualizationType.EXPLAIN]: {
      value: VisualizationType.EXPLAIN,
      name: VisualizationOptionsNamesMap[VisualizationType.EXPLAIN],
      disabled: true,
    },
    [VisualizationType.PARENT_MODEL_PREDICTIONS]: {
      value: VisualizationType.PARENT_MODEL_PREDICTIONS,
      name: VisualizationOptionsNamesMap[VisualizationType.PARENT_MODEL_PREDICTIONS],
      disabled: true,
    },
  };

  readonly visualizationOptionsField: AdvancedConfigField = {
    type: 'select',
    label: 'Visualization Type',
    name: 'visualizationType',
    options: Object.values(this.visualizationOptions),
    value: VisualizationType.DEFAULT,
  };

  readonly modelTaskTypes = ModelTaskTypes;

  private readonly _unsubscribe$ = new Subject();

  constructor(
    public paintingCanvasManagerService: PaintingCanvasManagerService,
    private _messagesService: MessagesService,
    private formBuilder: FormBuilder,
    private _cdr: ChangeDetectorRef
  ) {
    this.visualizationOptionsForm = this.formBuilder.group({});
    FormUtils.addControlsToForm([this.visualizationOptionsField], this.visualizationOptionsForm);
  }

  ngOnInit() {
    this.paintingCanvasManagerService.change$
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(() => this._cdr.detectChanges());
  }

  emitTest(): void {
    this.test.emit(this.visualizationOptionsForm.getRawValue());
  }

  ngOnDestroy() {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }
}
