import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, ViewChild } from '@angular/core';

import { Store } from '@ngrx/store';
import { Observable, of, Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { isNumber } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';

import { ProjectItem } from '@store/project-store/project.model';
import { ModelDomain, ModelItem, ModelSources, ModelTaskTypes } from '@store/model-store/model.model';
import { InferenceTestImageStoreActions, RootStoreState } from '@store';

import { TargetMachineItem, TargetMachineTypes } from '@shared/models/pipelines/target-machines/target-machine';

import { VisualizationConfigurationComponent } from '../visualization-configuration/visualization-configuration.component';
import { INetworkOutputTestEvent, NetworkOutputComponent } from '../network-output/network-output.component';

export const SUPPORTED_TASK_TYPES = [
  ModelTaskTypes.CLASSIFICATION,
  ModelTaskTypes.OBJECT_DETECTION,
  ModelTaskTypes.INSTANCE_SEGMENTATION,
  ModelTaskTypes.SEMANTIC_SEGMENTATION,
  ModelTaskTypes.INPAINTING,
  ModelTaskTypes.STYLE_TRANSFER,
  ModelTaskTypes.SUPER_RESOLUTION,
];

const PARENT_MODEL_PREDICTIONS_SUPPORTED_TASK_TYPES = [
  ModelTaskTypes.CLASSIFICATION,
  ModelTaskTypes.OBJECT_DETECTION,
  ModelTaskTypes.INSTANCE_SEGMENTATION,
  ModelTaskTypes.SEMANTIC_SEGMENTATION,
];

export type SUPPORTED_TASK_TYPE = typeof SUPPORTED_TASK_TYPES[number];

@Component({
  selector: 'wb-network-output-visualizer',
  templateUrl: './network-output-visualizer.component.html',
  styleUrls: ['./network-output-visualizer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkOutputVisualizerComponent implements OnDestroy {
  private _project: ProjectItem = null;
  @Input() set project(value: ProjectItem) {
    this._project = value;
    this._networkOutputComponent?.reset();
  }

  private _model: ModelItem = null;
  @Input() set model(value: ModelItem) {
    this._model = value;

    if (this._model.domain === ModelDomain.NLP) {
      return;
    }

    this.updateTaskType(value);
  }

  get model(): ModelItem {
    return this._model;
  }

  @Input() disabled = false;

  @Input() early = false;

  @Input() set target(value: TargetMachineItem) {
    this.isLocalTarget = value?.targetType === TargetMachineTypes.LOCAL;
  }

  @ViewChild(NetworkOutputComponent) private _networkOutputComponent: NetworkOutputComponent;

  @ViewChild(VisualizationConfigurationComponent)
  private _visualizationConfigurationComponent: VisualizationConfigurationComponent;

  taskType: ModelTaskTypes = null;

  supportedTaskType = false;
  parentModelVisualizationAvailable = false;

  ModelSources = ModelSources;

  hints = this._messagesService.hintMessages.networkOutputVisualization;

  visualizationConfigState: 'expanded' | 'collapsed' = null;

  isLocalTarget = false;

  ModelDomain = ModelDomain;

  private _taskTypeSubscription: Subscription = null;

  constructor(
    private _store$: Store<RootStoreState.State>,
    private _messagesService: MessagesService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy() {
    this._taskTypeSubscription?.unsubscribe();
  }

  updateTaskType(model: ModelItem): void {
    this._taskTypeSubscription?.unsubscribe();
    if (!model) {
      this.supportedTaskType = false;
      this.parentModelVisualizationAvailable = false;
      return;
    }

    let taskType$: Observable<ModelTaskTypes>;
    if (model.modelSource === ModelSources.OMZ) {
      taskType$ = of(this._model.visualizationConfiguration.taskType);
    } else {
      // force _visualizationConfigurationComponent under *ngIf assignment
      this._cdr.detectChanges();
      const taskTypeControl = this._visualizationConfigurationComponent.formHandler.form.controls.taskType;
      taskType$ = taskTypeControl.valueChanges.pipe(startWith(taskTypeControl.value as ModelTaskTypes));
    }

    this._taskTypeSubscription = taskType$.subscribe((taskType) => {
      this.taskType = taskType;
      this.supportedTaskType = SUPPORTED_TASK_TYPES.includes(taskType);
      this.parentModelVisualizationAvailable =
        model.analysis.isInt8 &&
        isNumber(model.optimizedFromModelId) &&
        PARENT_MODEL_PREDICTIONS_SUPPORTED_TASK_TYPES.includes(taskType);
    });

    if (!this.visualizationConfigState) {
      this.visualizationConfigState =
        this._model.visualizationConfiguration.taskType === ModelTaskTypes.GENERIC ? 'expanded' : 'collapsed';
    }
  }

  test({ file, mask, visualizationType }: INetworkOutputTestEvent) {
    this._store$.dispatch(
      InferenceTestImageStoreActions.testImage({
        modelId: this.model.id,
        deviceId: this._project?.deviceId,
        mask,
        file,
        visualizationType,
        visualizationConfig: this._visualizationConfigurationComponent?.getConfig(),
        early: this.early,
      })
    );
  }
}
