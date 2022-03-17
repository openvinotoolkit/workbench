import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Params, Router } from '@angular/router';

import { combineLatest, of, Subject } from 'rxjs';
import { filter, switchMap, take, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';
import { SessionService } from '@core/services/common/session.service';
import { NotificationType } from '@core/services/common/notification.service';

import {
  DatasetStoreSelectors,
  GlobalsStoreSelectors,
  ModelStoreSelectors,
  ModelTuningStoreActions,
  ProjectStoreActions,
  ProjectStoreSelectors,
  RootStoreState,
  RouterStoreSelectors,
  TargetMachineSelectors,
} from '@store';
import { ModelItem, ModelTaskTypes, TaskTypeToNameMap } from '@store/model-store/model.model';
import { DatasetItem, DatasetTypes } from '@store/dataset-store/dataset.model';
import {
  OptimizationAlgorithm,
  OptimizationAlgorithmPreset,
  OptimizationAlgorithmPresetNames,
  ProjectItem,
} from '@store/project-store/project.model';
import { InferenceUtils } from '@store/inference-history-store/inference-history.model';
import { getMergedRoute, selectParamProjectId } from '@store/router-store/route.selectors';
import { Route } from '@store/router-store/route.state';

import { Int8CalibrationConfig } from '@shared/models/int8-calibration-config';
import { CompoundInferenceConfig } from '@shared/models/compound-inference-config';
import { DeviceItem, DeviceItemUtils } from '@shared/models/device';
import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';
import { CalibrationPipelineStages } from '@shared/models/pipelines/pipeline';

@Component({
  selector: 'wb-calibration-configuration',
  templateUrl: './calibration-configuration.component.html',
  styleUrls: ['./calibration-configuration.component.scss'],
})
export class CalibrationConfigurationComponent implements OnInit, OnDestroy {
  project: ProjectItem;
  model: ModelItem;
  selectedDataset: DatasetItem;
  private _device: DeviceItem;

  readonly isTaskRunning$ = this._store$.select(GlobalsStoreSelectors.selectTaskIsRunning);

  readonly OptimizationAlgorithm = OptimizationAlgorithm;
  readonly CalibrationPipelineStages = CalibrationPipelineStages;
  readonly NotificationType = NotificationType;

  readonly calibrationTips = this._messagesService.hintMessages.calibrationTips;

  readonly calibrationTypes = [OptimizationAlgorithm.DEFAULT, OptimizationAlgorithm.ACCURACY_AWARE];

  readonly calibrationOptions = {
    [OptimizationAlgorithm.DEFAULT]: {
      label: this.calibrationTips.defaultCalibrationTitle,
      hint: this.calibrationTips.defaultCalibration,
      disabled: false,
    },
    [OptimizationAlgorithm.ACCURACY_AWARE]: {
      label: this.calibrationTips.acAwareCalibrationTitle,
      hint: this.calibrationTips.acAwareCalibration,
      disabled: false,
    },
  };

  readonly algorithmPresets = [
    {
      label: OptimizationAlgorithmPresetNames[OptimizationAlgorithmPreset.PERFORMANCE],
      value: OptimizationAlgorithmPreset.PERFORMANCE,
      hint: this.calibrationTips.performancePreset,
    },
    {
      label: OptimizationAlgorithmPresetNames[OptimizationAlgorithmPreset.MIXED],
      value: OptimizationAlgorithmPreset.MIXED,
      hint: this.calibrationTips.mixedPreset,
    },
  ];

  readonly calibrationFailedError = this._messagesService.errorMessages.projectStatus.int8CalibrationFailed;

  readonly taskIsRunningMsg = this._messagesService.tooltipMessages.global.taskIsRunning;

  readonly accuracyLossField: AdvancedConfigField = {
    type: 'input',
    label: 'Max Accuracy Drop',
    name: 'loss',
    value: 0.5,
    disabled: false,
    maxNumber: 100,
    numberType: 'float',
    validators: [Validators.required, Validators.min(0.1), Validators.max(10)],
    suffix: '%',
    tooltip: {
      prefix: 'optimizationForm',
      value: 'maxAccuracyDrop',
    },
  };

  readonly datasetSubsetFormField: AdvancedConfigField = {
    type: 'input',
    label: 'Subset Size, %',
    name: 'subsetSize',
    value: 100,
    maxNumber: 100,
    disabled: false,
    validators: [Validators.required, Validators.min(1), Validators.max(100)],
    suffix: '%',
    tooltip: {
      prefix: 'optimizationForm',
      value: 'subset',
    },
  };

  readonly calibrationForm = new FormGroup({
    optimization: new FormControl(OptimizationAlgorithm.DEFAULT, Validators.required),
    preset: new FormControl(OptimizationAlgorithmPreset.PERFORMANCE, Validators.required),
    [this.accuracyLossField.name]: new FormControl(this.accuracyLossField.value, this.accuracyLossField.validators),
    [this.datasetSubsetFormField.name]: new FormControl(
      this.datasetSubsetFormField.value,
      this.datasetSubsetFormField.validators
    ),
  });

  private readonly _unsubscribe$ = new Subject<void>();

  private _inferenceTime: number;

  readonly selectedChildProject$ = this._store$.select(ProjectStoreSelectors.getSelectedProjectByRouteQueryParam);

  isAccuracyConfigRequired = false;
  isOptimizationDisabled = false;
  isNotAnnotatedDatasetOptimizationDisabled = false;
  isMultiInputNaDatasetOptimizationDisabled = false;
  isDatasetIncompatible = false;
  isCalibrationStarted = false;

  constructor(
    private _router: Router,
    private _store$: Store<RootStoreState.State>,
    private _messagesService: MessagesService,
    public sessionService: SessionService
  ) {
    this._store$
      .select(getMergedRoute)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((route: Route) => {
        const { modelId } = route.queryParams;
        modelId
          ? this._store$.dispatch(ProjectStoreActions.loadProjectsForModel({ modelId }))
          : this._store$.dispatch(ProjectStoreActions.loadActiveProjects());
      });

    combineLatest([
      this._store$.select(RouterStoreSelectors.selectOptimizationQueryParam),
      this._store$.select(RouterStoreSelectors.selectPresetQueryParam),
      this._store$.select(RouterStoreSelectors.selectLossQueryParam),
    ])
      .pipe(take(1))
      .subscribe(([optimization, preset, loss]) => this._updateForm(optimization, preset, loss));

    this.calibrationForm.controls.optimization.valueChanges
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((optimization) => this.updateOptionsValidity(optimization));
  }

  get incompatibleDatasetHint(): string {
    return this._messagesService.getHint('calibrationTips', 'incompatibleDataset', {
      selectedModelTask: TaskTypeToNameMap[this.model.accuracyConfiguration.taskType],
      selectedDatasetName: this.selectedDataset.name,
    });
  }

  ngOnInit(): void {
    this._store$
      .select(selectParamProjectId)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((projectId) => {
        this._store$.dispatch(ProjectStoreActions.selectProject({ id: projectId }));
      });

    this._store$
      .select(ProjectStoreSelectors.getSelectedProjectByRouteParam)
      .pipe(
        filter((projectItem) => !!projectItem),
        switchMap((project) =>
          combineLatest([
            of(project),
            this._store$.select(ModelStoreSelectors.selectModelById, project.modelId),
            this._store$.select(DatasetStoreSelectors.selectDatasetById, project.datasetId),
            this._store$.select(TargetMachineSelectors.selectProjectDevice, project),
          ])
        ),
        filter(([, model, dataset]) => !!model && !!dataset),
        takeUntil(this._unsubscribe$)
      )
      .subscribe(([project, model, dataset, device]) => {
        this.project = project;
        this.model = model;
        this.selectedDataset = dataset;
        this._device = device;

        this.onDatasetSelected(this.selectedDataset);
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  private _updateForm(
    optimization: string = OptimizationAlgorithm.DEFAULT,
    preset: string = OptimizationAlgorithmPreset.PERFORMANCE,
    loss: string = this.calibrationForm.value.loss
  ): void {
    this.calibrationForm.patchValue({
      optimization,
      preset,
      [this.accuracyLossField.name]: Number(loss),
    });
  }

  onDatasetDeleted(dataset: DatasetItem): void {
    if (dataset === this.selectedDataset) {
      this.onDatasetSelected(null);
    }
  }

  onDatasetSelected(dataset: DatasetItem): void {
    this.selectedDataset = dataset;

    if (this.selectedDataset?.type === DatasetTypes.NOT_ANNOTATED) {
      this.calibrationOptions[OptimizationAlgorithm.ACCURACY_AWARE].disabled = true;
      this.calibrationForm.get('optimization').setValue(OptimizationAlgorithm.DEFAULT, { emitEvent: false });
    } else {
      this.calibrationOptions[OptimizationAlgorithm.ACCURACY_AWARE].disabled = false;
    }

    this.updateOptionsValidity(this.calibrationForm.value.optimization);
  }

  updateOptionsValidity(optimization: OptimizationAlgorithm): void {
    const { taskType } = this.model.accuracyConfiguration;

    const hasAccuracySettings = taskType !== ModelTaskTypes.GENERIC;

    const isDatasetCompatible =
      this.selectedDataset.tasks.includes(taskType) ||
      (taskType === ModelTaskTypes.CUSTOM && this.project.hasRawAccuracyConfig);

    const isSingleInput = this.model.analysis?.inputs.length === 1;

    const simplifiedModeEnabled =
      optimization === OptimizationAlgorithm.DEFAULT && isSingleInput && (!hasAccuracySettings || !isDatasetCompatible);

    const isAnnotatedDataset = this.selectedDataset.type !== DatasetTypes.NOT_ANNOTATED;

    this.isAccuracyConfigRequired = false;
    this.isDatasetIncompatible = false;
    this.isNotAnnotatedDatasetOptimizationDisabled = false;
    this.isMultiInputNaDatasetOptimizationDisabled = false;

    if (!simplifiedModeEnabled) {
      if (!isAnnotatedDataset) {
        if (!isSingleInput) {
          this.isMultiInputNaDatasetOptimizationDisabled = true;
        } else {
          this.isNotAnnotatedDatasetOptimizationDisabled = true;
        }
      } else if (!hasAccuracySettings) {
        this.isAccuracyConfigRequired = true;
      } else if (!isDatasetCompatible) {
        this.isDatasetIncompatible = true;
      }
    }

    this.isOptimizationDisabled =
      this.isNotAnnotatedDatasetOptimizationDisabled ||
      this.isMultiInputNaDatasetOptimizationDisabled ||
      this.isDatasetIncompatible ||
      this.isAccuracyConfigRequired;
  }

  calibrate(): void {
    this.isCalibrationStarted = true;
    const { optimization, preset, loss, subsetSize } = this.calibrationForm.value;
    const tuningConfig: Int8CalibrationConfig = {
      int8CalibrationConfig: {
        threshold: optimization === OptimizationAlgorithm.ACCURACY_AWARE ? Number(loss) : null,
        subsetSize,
        modelId: this.project.modelId,
        datasetId: this.selectedDataset.id,
        deviceId: this.project.deviceId,
        targetId: this.project.targetId,
        algorithm: optimization,
        preset,
        batch: 1,
      },
      profilingConfig: new CompoundInferenceConfig({
        inferences: [{ nireq: 1, batch: DeviceItemUtils.getMinStreams(this._device) }],
        modelId: this.project.modelId,
        datasetId: this.project.datasetId,
        deviceId: this.project.deviceId,
        targetId: this.project.targetId,
        inferenceTime: this._inferenceTime || null,
      }).prepareForRest(),
    };

    this._store$.dispatch(
      ModelTuningStoreActions.modelInt8CalibrationStart({
        tuningConfig,
        originalModelId: this.project.originalModelId,
      })
    );
  }

  goToModel(): void {
    this._router.navigate(['models', this.project.originalModelId]);
  }

  goToProject(): void {
    this._router.navigate(['dashboard', this.project.modelId, 'projects', this.project.id]);
  }

  configureAccuracy(): void {
    const { optimization, preset, loss } = this.calibrationForm.value;
    const queryParams: Params = { optimization, preset, loss, fromCalibration: true };
    this._router.navigate(
      ['projects', 'edit-accuracy', 'models', this.project.originalModelId, 'projects', this.project.id],
      { queryParams }
    );
  }

  setInferenceTime(): void {
    this._inferenceTime = InferenceUtils.shortenInferenceTime;
  }

  goToImportDataset(): void {
    const { optimization, preset, loss } = this.calibrationForm.value;
    this._router.navigate(['dataset-manager/import-calibration-dataset'], {
      queryParams: {
        modelId: this.model.id,
        projectId: this.project.id,
        optimization,
        loss,
        preset,
      },
    });
  }
}
