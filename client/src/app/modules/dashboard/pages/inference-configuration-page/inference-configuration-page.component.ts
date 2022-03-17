import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { Store } from '@ngrx/store';
import { combineLatest, Subject } from 'rxjs';
import { filter, map, take, takeUntil, withLatestFrom } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';
import { SessionService } from '@core/services/common/session.service';

import {
  InferenceHistoryStoreActions,
  InferenceResultStoreActions,
  ModelStoreActions,
  ProjectStoreActions,
  RootStoreState,
  TargetMachineSelectors,
} from '@store';
import { getSelectedProjectByRouteParam } from '@store/project-store/project.selectors';
import { selectExecutedInferencePoints } from '@store/inference-history-store/inference-history.selectors';
import { selectParamModelId, selectParamProjectId } from '@store/router-store/route.selectors';
import { InferenceUtils } from '@store/inference-history-store/inference-history.model';

import { CompoundInferenceConfig, IInferenceConfiguration } from '@shared/models/compound-inference-config';
import { DeviceItemUtils } from '@shared/models/device';

import { InferenceConfigurationService } from './inference-configuration.service';

export interface IInferenceMatrix {
  rowLabels: string[];
  columnLabels: string[];
  rows: IInferenceConfiguration[][];
}

@Component({
  selector: 'wb-inference-configuration-page',
  templateUrl: './inference-configuration-page.component.html',
  styleUrls: ['./inference-configuration-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InferenceConfigurationPageComponent implements OnInit, OnDestroy {
  project$ = this.store$.select(getSelectedProjectByRouteParam);
  inferenceHistory$ = this.store$.select(selectExecutedInferencePoints);

  matrix: IInferenceMatrix = null;

  matrixControl = new FormControl([]);

  matrixFormGroup = new FormGroup(
    {
      maxBatches: new FormControl(256),
      maxStreams: new FormControl(0),
      streamColumns: new FormControl(10),
      batchRows: new FormControl(10),
      batchRowsPower: new FormControl(false),
    },
    { validators: this.matrixColumnsAndRowsLengthValidator }
  );

  private inferenceTime = InferenceUtils.defaultInferenceTime;

  estimatedInferenceDuration = null;

  isProfilingStarted = false;

  private unsubscribe$ = new Subject();

  constructor(
    private store$: Store<RootStoreState.State>,
    private router: Router,
    private inferenceConfigurationService: InferenceConfigurationService,
    public messagesService: MessagesService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    public sessionService: SessionService
  ) {}

  ngOnInit() {
    this.store$
      .select(selectParamModelId)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((modelId) => {
        this.store$.dispatch(ModelStoreActions.loadSelectedModelById({ id: modelId }));
        this.store$.dispatch(ProjectStoreActions.loadProjectsForModel({ modelId }));
      });

    this.store$
      .select(selectParamProjectId)
      .pipe(
        filter((projectId) => !!projectId),
        takeUntil(this.unsubscribe$)
      )
      .subscribe((id) => {
        this.store$.dispatch(ProjectStoreActions.selectProject({ id }));
        this.store$.dispatch(InferenceHistoryStoreActions.loadInferenceHistory({ id }));
      });

    // select and set max streams value to control
    combineLatest([
      this.store$.select(getSelectedProjectByRouteParam),
      this.store$.select(TargetMachineSelectors.selectAllDevicesMap),
    ])
      .pipe(
        filter(([project, devicesMap]) => !!project && !!devicesMap && !!devicesMap[project.deviceId]),
        map(([project, devicesMap]) => devicesMap[project.deviceId]),
        takeUntil(this.unsubscribe$)
      )
      .subscribe((device) => {
        this.matrixFormGroup.patchValue({ maxStreams: DeviceItemUtils.getMaxStreams(device) });
        this.cdr.detectChanges();
      });

    // on power change reset rows length
    // do not emit value because root form group value change handler
    // will be called after power control handler anyway
    this.matrixFormGroup.controls.batchRowsPower.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.matrixFormGroup.patchValue({ batchRows: 10 }, { emitEvent: false });
    });

    // build matrix on parameter change
    this.matrixFormGroup.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(({ maxBatches, maxStreams, streamColumns, batchRows, batchRowsPower }) => {
        this.matrix = this.inferenceConfigurationService.generateInferenceMatrix(
          maxStreams,
          streamColumns,
          maxBatches,
          batchRows,
          batchRowsPower ? 2 : null
        );
        this.cdr.detectChanges();
      });

    this.matrixControl.valueChanges
      .pipe(takeUntil(this.unsubscribe$), withLatestFrom(this.project$))
      .subscribe(([inferences, project]) => {
        if (!inferences.length || !project) {
          this.estimatedInferenceDuration = null;
          return;
        }

        this.estimatedInferenceDuration =
          InferenceUtils.calcEstimatedInferenceTime(project.deviceType, this.inferenceTime) * inferences.length;
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.store$.dispatch(ProjectStoreActions.resetSelectedProject());
    this.store$.dispatch(InferenceResultStoreActions.resetSelectedInferenceResult());
    this.store$.dispatch(InferenceHistoryStoreActions.resetInferenceHistory());
  }

  add() {
    const value: Partial<{ streamColumns: number; batchRows: number }> = {};
    if (!this.matrixFormGroup.hasError('noNextColumns')) {
      value.streamColumns = this.matrixFormGroup.value.streamColumns + 10;
    }
    if (!this.matrixFormGroup.hasError('noNextRows')) {
      value.batchRows = this.matrixFormGroup.value.batchRows + 10;
    }

    this.matrixFormGroup.patchValue(value);
  }

  onSelectedInferenceRemove(value: IInferenceConfiguration) {
    this.matrixControl.setValue(this.matrixControl.value.filter((selected) => selected !== value));
  }

  matrixColumnsAndRowsLengthValidator(form: FormGroup): ValidationErrors | null {
    const { maxBatches, batchRows, maxStreams, streamColumns, batchRowsPower } = form.value;
    const hasNextStreamColumns = streamColumns < maxStreams;
    const hasNextBatchRows = batchRowsPower ? 2 ** batchRows + 1 < maxBatches : batchRows < maxBatches;

    const errors: ValidationErrors = {};
    if (!hasNextStreamColumns) {
      errors.noNextColumns = true;
    }
    if (!hasNextBatchRows) {
      errors.noNextRows = true;
    }

    return Object.keys(errors).length ? errors : null;
  }

  goToModel(): void {
    this.project$.pipe(take(1)).subscribe(({ originalModelId }) => this.router.navigate(['models', originalModelId]));
  }

  goToProject(): void {
    this.project$
      .pipe(take(1))
      .subscribe(({ id, originalModelId }) => this.router.navigate(['dashboard', originalModelId, 'projects', id]));
  }

  runInference(): void {
    this.isProfilingStarted = true;
    this.project$.pipe(take(1)).subscribe((project) => {
      const config = new CompoundInferenceConfig({
        deviceId: project.deviceId,
        inferenceTime: this.inferenceTime,
        inferences: this.matrixControl.value,
        datasetId: project.datasetId,
        modelId: project.modelId,
        deviceName: project.deviceName,
        targetId: project.targetId,
      });

      this.store$.dispatch(InferenceHistoryStoreActions.addRunInferenceRequest({ config }));

      this.goToProject();
    });
  }

  reduceInferenceTime() {
    this.inferenceTime = InferenceUtils.shortenInferenceTime;
  }
}
