import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';

import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map, startWith, switchMap, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';
import { SessionService } from '@core/services/common/session.service';
import { DialogService } from '@core/services/common/dialog.service';

import { ModelItem, ModelSources, ModelTaskTypes, TaskTypeToNameMap } from '@store/model-store/model.model';
import { DatasetItem, DatasetTypes } from '@store/dataset-store/dataset.model';
import { ProjectItem } from '@store/project-store/project.model';
import { ModelStoreSelectors } from '@store/model-store';
import {
  AdvancedAccuracyStoreSelectors,
  DatasetStoreActions,
  DatasetStoreSelectors,
  ProjectStoreActions,
  ProjectStoreSelectors,
  RootStoreState,
} from '@store/index';

import { AccuracyPipelineStages, PipelineStage } from '@shared/models/pipelines/pipeline';
import { InfoHint } from '@shared/components/info-hint/info-hint.component';
import { SwitchButtonComponent } from '@shared/components/switch-button/switch-button.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

import { BasicAccuracyConfigurationComponent } from '../../components/basic-accuracy-configuration/basic-accuracy-configuration.component';
import { AdvancedAccuracyConfigurationComponent } from '../../../accuracy/components/advanced-accuracy-configuration/advanced-accuracy-configuration.component';
import { PERFORM_RIBBON_IDS } from '../../../dashboard/constants';
import { DashboardTab } from '../../../dashboard/pages/dashboard-page/dashboard-page.component';

type EditMode = 'basic' | 'advanced';

@Component({
  selector: 'wb-edit-accuracy',
  templateUrl: './edit-accuracy.component.html',
  styleUrls: ['./edit-accuracy.component.scss'],
})
export class EditAccuracyComponent implements OnInit {
  public project$: Observable<ProjectItem> = this.store$
    .select(ProjectStoreSelectors.getSelectedProjectByRouteParam)
    .pipe(filter((v) => !!v));

  public model$: Observable<ModelItem> = this.project$.pipe(
    switchMap(({ originalModelId }) => this.store$.select(ModelStoreSelectors.selectModelById, originalModelId))
  );

  public dataset$: Observable<DatasetItem> = this.project$.pipe(
    switchMap(({ datasetId }) => this.store$.select(DatasetStoreSelectors.selectDatasetById, datasetId))
  );

  public savePending$ = combineLatest([
    this.store$.select(ModelStoreSelectors.selectAccuracySavePending),
    this.store$.select(AdvancedAccuracyStoreSelectors.selectRawAccuracySavePending),
  ]).pipe(map(([pending1, pending2]) => pending1 || pending2));

  public taskType$ = new BehaviorSubject<ModelTaskTypes>(null);
  public mode$ = new BehaviorSubject<EditMode>(null);

  public areTypesMatch$ = combineLatest([this.mode$, this.dataset$, this.taskType$]).pipe(
    map(
      ([mode, dataset, taskType]) =>
        mode === 'advanced' || dataset?.tasks.includes(taskType) || dataset?.type === DatasetTypes.NOT_ANNOTATED
    )
  );

  public modelTaskTypes = ModelTaskTypes;
  public pipelineStage = PipelineStage;
  public formValid: boolean;

  _incompatibleTypesHint$ = combineLatest([this.model$, this.taskType$, this.areTypesMatch$]).pipe(
    filter(([model]) => !!model),
    map(([model, taskType, areTypesMatch]) =>
      !areTypesMatch
        ? {
            message: this.messagesService.getHint('calibrationTips', 'incompatibleDatasetAndModel', {
              taskName: TaskTypeToNameMap[taskType],
              modelName: model.name,
            }),
            type: 'warning',
          }
        : null
    )
  );

  readonly queryParams = {
    fromCalibration: false,
  };

  private _sessionMessageHint$ = this.sessionService.startProcessWarningMessage$.pipe(
    map((message) => ({ message, type: 'warning' }))
  );

  readonly accuracyPipelineStages = AccuracyPipelineStages;
  readonly accuracyFailed = this.messagesService.errorMessages.projectStatus.accuracyFailed;

  warningHint$ = combineLatest([
    this._incompatibleTypesHint$,
    this._sessionMessageHint$.pipe(startWith(null as InfoHint)),
  ]).pipe(map(([incompatibleTypesHint, sessionMessageHint]) => incompatibleTypesHint || sessionMessageHint));

  @ViewChild(BasicAccuracyConfigurationComponent) basicConfiguration: BasicAccuracyConfigurationComponent;
  @ViewChild(AdvancedAccuracyConfigurationComponent) advancedConfiguration: AdvancedAccuracyConfigurationComponent;
  @ViewChild(SwitchButtonComponent) switchComponent: SwitchButtonComponent;

  hint = this.messagesService.hintMessages.accuracyConfiguration;

  constructor(
    private _cdr: ChangeDetectorRef,
    private store$: Store<RootStoreState.State>,
    private router: Router,
    private route: ActivatedRoute,
    private messagesService: MessagesService,
    public sessionService: SessionService,
    private _dialogService: DialogService
  ) {
    this.queryParams = {
      fromCalibration: this.route.snapshot.queryParamMap.get('fromCalibration') === 'true',
    };

    const { modelId } = this.route.snapshot.params;
    this.store$.dispatch(DatasetStoreActions.loadDatasets());
    this.store$.dispatch(ProjectStoreActions.loadProjectsForModel({ modelId }));
  }

  ngOnInit(): void {
    combineLatest([this.project$, this.model$])
      .pipe(
        filter(([project, model]) => !!project && !!model),
        take(1)
      )
      .subscribe(([{ hasRawAccuracyConfig }, { modelSource }]) => {
        const mode: EditMode = hasRawAccuracyConfig || modelSource === ModelSources.OMZ ? 'advanced' : 'basic';
        this.mode$.next(mode);
      });
  }

  handleUsageChange(taskType: ModelTaskTypes): void {
    this.taskType$.next(taskType);
  }

  onModeChange(mode: EditMode): void {
    if (!this.mode$.value) {
      return;
    }

    if (this.mode$.value === 'advanced' && mode === 'basic') {
      // hack in order to fix changing value behind dialog
      if (this.switchComponent) {
        this.switchComponent.leftOptionChecked = false;
      }

      this.openModeChangeConfirmationDialog()
        .beforeClosed()
        .subscribe((result) => {
          if (result) {
            this.mode$.next(mode);
          }
          this._cdr.detectChanges();
        });
      return;
    }

    this.mode$.next(mode);
    this._cdr.detectChanges();
  }

  onValidityChange(value: boolean): void {
    this.formValid = value;
  }

  async goToModel(): Promise<void> {
    const { originalModelId } = await this.project$.pipe(take(1)).toPromise();

    this.router.navigate(['models', originalModelId]);
  }

  async goToProject(): Promise<void> {
    const { id, originalModelId } = await this.project$.pipe(take(1)).toPromise();

    this.router.navigate(['dashboard', originalModelId, 'projects', id], {
      state: {
        tab: DashboardTab.PERFORM,
        ribbon: PERFORM_RIBBON_IDS.CREATE_ACCURACY_REPORT,
      },
    });
  }

  async goToCalibrationPage(): Promise<void> {
    const { id } = await this.project$.pipe(take(1)).toPromise();

    this.router.navigate(['projects/edit-calibration', id], { queryParamsHandling: 'preserve' });
  }

  save(): void {
    const onSuccess = this.navigateBack.bind(this);
    if (this.mode$.value === 'basic') {
      this.basicConfiguration.save(onSuccess);
    } else {
      this.advancedConfiguration.save(onSuccess);
    }
  }

  navigateBack(): void {
    if (this.queryParams.fromCalibration) {
      this.goToCalibrationPage();
    } else {
      this.goToProject();
    }
  }

  async chooseAnother(): Promise<void> {
    const { id } = await this.model$.pipe(take(1)).toPromise();
    this.router.navigate(['projects/create'], {
      queryParams: {
        modelId: id,
      },
    });
  }

  openModeChangeConfirmationDialog(): MatDialogRef<ConfirmDialogComponent, boolean> {
    return this._dialogService.openConfirmationDialog({
      message: this._dialogService.dialogMessages.fromAdvancedToBasicConfirmation,
      confirmButtonText: 'Go to Basic',
    });
  }
}
