import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { Subject } from 'rxjs';
import { Store } from '@ngrx/store';
import { filter, takeUntil } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';
import { SessionService } from '@core/services/common/session.service';

import { ModelDomain, ModelItem, ModelPrecisionType, ModelTaskTypes } from '@store/model-store/model.model';
import { DatasetItem, DatasetTypes } from '@store/dataset-store/dataset.model';
import {
  DatasetStoreSelectors,
  GlobalsStoreSelectors,
  InferenceHistoryStoreActions,
  InferenceHistoryStoreSelectors,
  ModelStoreSelectors,
  RootStoreState,
  RouterStoreSelectors,
} from '@store';
import { ProjectStatusNames } from '@store/project-store/project.model';
import { InferenceUtils } from '@store/inference-history-store/inference-history.model';

import { InfoHint } from '@shared/components/info-hint/info-hint.component';
import { TargetMachineItem } from '@shared/models/pipelines/target-machines/target-machine';
import { DeviceItem, DeviceItemUtils } from '@shared/models/device';
import { MasterDetailComponent } from '@shared/components/master-detail/master-detail.component';
import { CompoundInferenceConfig } from '@shared/models/compound-inference-config';
import { RouterUtils } from '@shared/utils/router-utils';

import { CREATE_PROJECT_STAGES } from '../../../dashboard/constants';
import { SelectEnvironmentStageComponent } from './select-environment-stage/select-environment-stage.component';

export interface WizardPageQueryParameters {
  modelId?: number;
  targetId?: number;
  deviceId?: number;
  datasetId?: number;
  stage?: CREATE_PROJECT_STAGES;
}

@Component({
  selector: 'wb-create-project-page',
  templateUrl: './create-project-page.component.html',
  styleUrls: ['./create-project-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProjectPageComponent implements OnInit, OnDestroy {
  public readonly createProjectStages = CREATE_PROJECT_STAGES;

  // Component state fields
  public areTypesMatch = false;
  public isDomainMatch = false;
  public isSupportedPrecision = false;
  public unsupportedPrecisions: ModelPrecisionType[] = [];
  public currentStage = CREATE_PROJECT_STAGES.MODEL;
  public inferenceTime: number;
  public defaultTargetMachine: TargetMachineItem;

  // Selected project items
  public selectedModel: ModelItem;
  public selectedDetailsModel: ModelItem;
  public selectedTargetDevice: DeviceItem;
  public selectedTargetMachine: TargetMachineItem;
  public selectedDataset: DatasetItem;

  // Store selectors
  public readonly isDevCloudNotAvailable$ = this._store$.select(GlobalsStoreSelectors.selectIsDevCloudNotAvailable);
  public readonly isTaskRunning$ = this._store$.select(GlobalsStoreSelectors.selectTaskIsRunning);
  public readonly isInferenceLoading$ = this._store$.select(InferenceHistoryStoreSelectors.selectInferenceIsLoading);

  private _isDevCloudNotAvailable: boolean = null;
  private _isTaskRunning: boolean = null;

  isProjectCreating = false;

  // Messages
  public readonly createProjectMessages = this._messagesService.hintMessages.createProject;
  public readonly devCloudMessages = this._messagesService.hintMessages.devCloud;
  public readonly taskIsRunningMsg = this._messagesService.tooltipMessages.global.taskIsRunning;

  private _sessionStartProcessWarningMessage: string = null;

  @ViewChild('wbMasterDetail') modelDetailsPanel: MasterDetailComponent;
  @ViewChild(SelectEnvironmentStageComponent) environmentStageComponent: SelectEnvironmentStageComponent;

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    private readonly _store$: Store<RootStoreState.State>,
    private readonly _router: Router,
    private readonly _location: Location,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _messagesService: MessagesService,
    private readonly _sessionService: SessionService
  ) {}

  ngOnInit(): void {
    // Set model
    this._store$
      .select(ModelStoreSelectors.getSelectedModelByQueryParam)
      .pipe(
        takeUntil(this._unsubscribe$),
        filter((model) => !!model)
      )
      .subscribe((model) => {
        this.onModelSelected(model);
      });

    // Set dataset
    this._store$
      .select(DatasetStoreSelectors.getSelectedDatasetByQueryParam)
      .pipe(
        takeUntil(this._unsubscribe$),
        filter((dataset) => !!dataset)
      )
      .subscribe((dataset) => {
        this.onDatasetSelected(dataset);
      });

    this._sessionService.startProcessWarningMessage$.pipe(takeUntil(this._unsubscribe$)).subscribe((message) => {
      this._sessionStartProcessWarningMessage = message;
      this._cdr.detectChanges();
    });

    this.isTaskRunning$.pipe(takeUntil(this._unsubscribe$)).subscribe((flag) => {
      this._isTaskRunning = flag;
      this._cdr.detectChanges();
    });

    this.isDevCloudNotAvailable$.pipe(takeUntil(this._unsubscribe$)).subscribe((flag) => {
      this._isDevCloudNotAvailable = flag;
      this._cdr.detectChanges();
    });

    this._store$
      .select(RouterStoreSelectors.selectQueryParamStage)
      .pipe(
        takeUntil(this._unsubscribe$),
        filter((stage) => stage)
      )
      .subscribe((stage: CREATE_PROJECT_STAGES) => {
        this.currentStage = stage;
      });

    this.isInferenceLoading$
      .pipe(
        takeUntil(this._unsubscribe$),
        filter((isLoading) => !isLoading)
      )
      .subscribe(() => {
        this.isProjectCreating = false;
        this._cdr.detectChanges();
      });

    // Remove query parameters from url as they are kept in store
    RouterUtils.deleteQueryParamsFromUrl(this._location);
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  openModelImport(): void {
    this._router.navigate(['model-manager', 'import'], { queryParams: this.getQueryParams() });
  }

  openDatasetUpload(): void {
    this._router.navigate(['dataset-manager', 'import'], { queryParams: this.getQueryParams() });
  }

  openTextDatasetUpload(): void {
    this._router.navigate(['dataset-manager', 'text-dataset', 'import'], { queryParams: this.getQueryParams() });
  }

  toStage(stage: CREATE_PROJECT_STAGES): void {
    this.currentStage = stage;
  }

  resetStage(stage: CREATE_PROJECT_STAGES): void {
    switch (stage) {
      case CREATE_PROJECT_STAGES.MODEL:
        this.onModelSelected(null);
        break;

      case CREATE_PROJECT_STAGES.ENVIRONMENT:
        this.environmentStageComponent.setTargetAsDefault();
        break;

      case CREATE_PROJECT_STAGES.DATASET:
        this.onDatasetSelected(null);
        break;
    }

    this.toStage(stage);
  }

  cancel(): void {
    this._router.navigate(['home']);
  }

  getQueryParams(): WizardPageQueryParameters {
    return {
      modelId: this.selectedModel?.id,
      targetId: this.selectedTargetMachine?.targetId,
      deviceId: this.selectedTargetDevice?.id,
      datasetId: this.selectedDataset?.id,
      stage: this.currentStage,
    };
  }

  onModelSelected(model: ModelItem): void {
    if (this.modelDetailsPanel && this.modelDetailsPanel.detailsSidenav.opened) {
      this.modelDetailsPanel.detailsSidenav.close();
    }
    this.selectedModel = model;
    this.checkTypesMatch();
    this.isDomainMatch = this._isDomainMatch();
  }

  onModelDetailsSelected(model: ModelItem): void {
    this.selectedDetailsModel = model;
    this.modelDetailsPanel.detailsSidenav.open();
  }

  onDatasetSelected(dataset: DatasetItem): void {
    if (dataset?.status.name === ProjectStatusNames.ERROR) {
      return;
    }
    this.selectedDataset = dataset;
    this.checkTypesMatch();
    this.isDomainMatch = this._isDomainMatch();
  }

  checkTypesMatch(): void {
    this._cdr.detectChanges();
    this.environmentStageComponent?.checkSupportedPrecision(this.selectedTargetDevice);

    if (!this.selectedModel || !this.selectedDataset) {
      return;
    }

    this.areTypesMatch =
      this.selectedDataset.tasks.includes(this.selectedModel.accuracyConfiguration.taskType) ||
      this.selectedModel.accuracyConfiguration.taskType === ModelTaskTypes.GENERIC ||
      this.selectedDataset.type === DatasetTypes.NOT_ANNOTATED;
  }

  private _isDomainMatch(): boolean {
    if (!this.selectedModel || !this.selectedDataset) {
      return false;
    }

    if (this.selectedModel.domain === ModelDomain.CV && this.selectedDataset.type !== DatasetTypes.CSV) {
      return true;
    }

    return this.selectedModel.domain === ModelDomain.NLP && this.selectedDataset.type === DatasetTypes.CSV;
  }

  get isCreateProjectDisabled(): boolean {
    return (
      !this.selectedModel ||
      !this.selectedDataset ||
      !this.selectedTargetDevice ||
      !this.areTypesMatch ||
      !this.isDomainMatch ||
      !this.isSupportedPrecision ||
      this._isTaskRunning ||
      this._isDevCloudNotAvailable
    );
  }

  runInference(): void {
    this.isProjectCreating = true;

    const config = new CompoundInferenceConfig({
      deviceId: this.selectedTargetDevice.id,
      deviceName: this.selectedTargetDevice.deviceName,
      inferenceTime: this.inferenceTime || null,
      inferences: [{ batch: 1, nireq: DeviceItemUtils.getMinStreams(this.selectedTargetDevice) }],
      datasetId: this.selectedDataset.id,
      modelId: this.selectedModel.id,
      targetId: this.selectedTargetMachine.targetId,
    });

    this._store$.dispatch(InferenceHistoryStoreActions.addRunInferenceRequest({ config }));
  }

  get unsupportedPrecisionsHint(): string {
    return this._messagesService.getHint('wizardHints', 'unsupportedPrecisions', {
      deviceName: this.selectedTargetDevice.type,
      selectedModelName: this.selectedModel.name,
      pluralSuffix: this.unsupportedPrecisions.length > 1 ? 's' : '',
      commaJoinedPrecisions: this.unsupportedPrecisions.toString(),
    });
  }

  get pageHint(): InfoHint {
    // DevCloud not available warning
    if (this._isDevCloudNotAvailable) {
      return { message: this.devCloudMessages.notRespondingWarning, type: 'warning' };
    }

    // Device and model precision mismatch warning
    if (!this.isSupportedPrecision && this.selectedModel && this.selectedDataset && this.selectedTargetDevice) {
      return { message: this.unsupportedPrecisionsHint, type: 'attention' };
    }

    // Model and dataset domain mismatch warning
    if (this.selectedModel && this.selectedDataset && !this.isDomainMatch) {
      return { message: this.createProjectMessages.modelDatasetDomainIncompatibleWarning, type: 'attention' };
    }

    // Model and dataset mismatch warning
    if (!this.areTypesMatch && this.selectedModel && this.selectedDataset) {
      return { message: this.createProjectMessages.modelDatasetIncompatibleWarning, type: 'attention' };
    }

    // Task is running warning
    if (this._isTaskRunning) {
      return { message: this.taskIsRunningMsg, type: 'attention' };
    }

    // Session expires soon warning
    if (this._sessionStartProcessWarningMessage) {
      return { message: this._sessionStartProcessWarningMessage, type: 'attention' };
    }

    return { message: this.createProjectMessages.selectionHint, type: 'default' };
  }

  setInferenceTime(): void {
    this.inferenceTime = InferenceUtils.shortenInferenceTime;
  }
}
