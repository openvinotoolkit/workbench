import { Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { Store } from '@ngrx/store';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { isObject } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';
import { DialogService } from '@core/services/common/dialog.service';
import { NotificationType } from '@core/services/common/notification.service';

import {
  EditModelConvertConfigDTO,
  ModelConvertConfig,
  ModelDomain,
  modelDomainNames,
  modelFrameworkNamesMap,
  ModelFrameworks,
  ModelItem,
  ModelSources,
  UploadingModelDTO,
} from '@store/model-store/model.model';
import {
  GlobalsStoreActions,
  GlobalsStoreSelectors,
  ModelStoreActions,
  ModelStoreSelectors,
  RootStoreState,
} from '@store';
import * as EnvironmentSetup from '@store/globals-store/environment-setup.actions';
import { JobTypes, ProjectStatus, ProjectStatusNames } from '@store/project-store/project.model';
import * as ModelsSelector from '@store/model-store/model.selectors';
import { SupportedFeaturesPreview } from '@store/globals-store/globals.state';

import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';
import { MasterDetailComponent } from '@shared/components/master-detail/master-detail.component';
import { RouterUtils } from '@shared/utils/router-utils';
import { PipelineStatus } from '@shared/models/pipelines/pipeline';
import { deprecatedIrVersionMessageKey } from '@shared/constants';

enum MODEL_WIZARD_STAGES {
  UPLOAD = 1,
  PREPARING_ENVIRONMENT,
  IMPORT_HUGGINGFACE_MODEL_JOB,
  CONVERT_FORM,
  CONVERTING,
  RESHAPE_FORM,
  RESHAPING,
  DONE,
}

@Component({
  selector: 'wb-model-manager-wizard',
  templateUrl: './model-manager-wizard.component.html',
  styleUrls: ['./model-manager-wizard.component.scss'],
})
export class ModelManagerWizardComponent implements OnDestroy {
  @ViewChild('wbMasterDetail') modelDetailsPanel: MasterDetailComponent;

  private _model: Partial<ModelItem>;
  @Input() set model(value: Partial<ModelItem>) {
    this._model = value;
    this.updateStage();
  }

  get model(): Partial<ModelItem> {
    return this._model;
  }

  @Input() isEdit = false;

  public readonly ModelDomain = ModelDomain;
  public readonly ModelSources = ModelSources;

  readonly MODEL_WIZARD_STAGES = MODEL_WIZARD_STAGES;
  readonly NOTIFICATION_TYPE = NotificationType;

  readonly prepareFrameworkDescription = this._messagesService.tooltipMessages.modelManager.prepareFrameworkDescription;
  readonly modelImportFailedMessage = this._messagesService.errorMessages.importModelStatus.defaultErrorMessage;
  readonly deprecatedErrorMessageTitle = this._messagesService.errorMessages.modelUpload.deprecatedIRVersionTitle;
  readonly deprecatedErrorMessageDescription =
    this._messagesService.errorMessages.modelUpload.deprecatedIRVersionDescription;
  readonly environmentAlreadyRunningMessage = this._messagesService.errorMessages.environmentSetup.alreadyRunning;

  readonly modelFrameworkNamesMap = modelFrameworkNamesMap;
  readonly modelDomainNames = modelDomainNames;

  readonly stagesHeader = {
    upload: 'Import Model',
    environment: 'Prepare Environment',
    importFromHuggingface: 'Download from Huggingface and Convert to ONNX',
    convert: 'Convert Model to IR',
    analyze: 'Analyze Model',
    reshape: 'Configure Model Inputs',
  };

  readonly isObject = isObject;

  readonly progressStagesLabelsMap = {
    [JobTypes.SETUP_ENVIRONMENT_JOB]: 'Preparing',
    [JobTypes.MODEL_OPTIMIZER_SCAN]: 'Analyzing Model Structure',
    [JobTypes.MODEL_OPTIMIZER_JOB]: 'Converting',
    [JobTypes.IMPORT_HUGGINGFACE_MODEL_JOB]: 'Importing Huggingface Model',
    [JobTypes.OMZ_MODEL_CONVERT_JOB]: 'Converting',
    [JobTypes.MODEL_ANALYZER_JOB]: 'Analyzing IR',
    [JobTypes.ANALYZE_MODEL_INPUT_SHAPE_JOB]: 'Analyze Input Shape',
    [JobTypes.PREPARING_RESHAPE_MODEL_ASSETS]: 'Preparing Reshape Model Assets',
    [JobTypes.RESHAPE_MODEL]: 'Reshape',
    [JobTypes.RESHAPE_MODEL_ANALYZE]: 'Analyze',
    [JobTypes.APPLY_MODEL_LAYOUT]: 'Set Layout',
  };

  modelWizardStage = MODEL_WIZARD_STAGES.UPLOAD;

  selectedForDetailsModel: ModelDownloaderDTO = null;

  readonly omzModels$ = this._store$.select(ModelStoreSelectors.selectOMZModels);
  readonly omzModelsAreLoading$ = this._store$.select(ModelStoreSelectors.selectOMZModelsAreLoading);
  readonly isConnected$ = this._store$.select(GlobalsStoreSelectors.selectConnectionStatusState);
  readonly frameworksAvailability$ = this._store$.select(GlobalsStoreSelectors.selectFrameworksAvailability);
  readonly importError$ = this._store$.select(ModelStoreSelectors.selectModelError);
  readonly configurePipeline$ = this._store$.select(ModelsSelector.selectRunningConfigurePipeline);
  readonly environmentSetup$ = this._store$.select(GlobalsStoreSelectors.selectEnvironmentSetup);

  readonly areModelZooFeaturesEnabled$ = combineLatest([
    this._store$.select(GlobalsStoreSelectors.selectIsFeaturePreviewSupported(SupportedFeaturesPreview.OMZ_REDESIGN)),
    this._store$.select(
      GlobalsStoreSelectors.selectIsFeaturePreviewSupported(SupportedFeaturesPreview.HUGGING_FACE_MODELS)
    ),
  ]);

  modelSource: ModelSources;

  redirectAllowed = true;

  private readonly _errorKey = 'importModelStatus';

  private readonly _unsubscribe$ = new Subject<void>();

  public readonly projectStatusNames = ProjectStatusNames;

  public isInputsSpecified = false;

  public configureStatus: PipelineStatus = null;

  public readonly environmentError = 'Setup environment job is already running';

  constructor(
    private _router: Router,
    private _store$: Store<RootStoreState.State>,
    private _messagesService: MessagesService,
    private _dialogService: DialogService,
    private _location: Location
  ) {
    this._store$.dispatch(ModelStoreActions.loadOMZModels());
    this._store$.dispatch(GlobalsStoreActions.getFrameworksAvailability());

    this.configurePipeline$.pipe(takeUntil(this._unsubscribe$)).subscribe((pipeline) => {
      this.configureStatus = pipeline?.status;

      this.updateStage();
    });

    RouterUtils.deleteQueryParamsFromUrl(this._location);
  }

  updateStage(): void {
    if (!this.model) {
      return;
    }

    let nextStage = null;

    switch (this.model.status.name) {
      case ProjectStatusNames.RUNNING:
        if (this.runningStage) {
          const pageStagesModelRunningStagesMap = {
            [JobTypes.WAIT_MODEL_UPLOAD_JOB]: MODEL_WIZARD_STAGES.UPLOAD,
            [JobTypes.SETUP_ENVIRONMENT_JOB]: MODEL_WIZARD_STAGES.PREPARING_ENVIRONMENT,
            [JobTypes.IMPORT_HUGGINGFACE_MODEL_JOB]: MODEL_WIZARD_STAGES.IMPORT_HUGGINGFACE_MODEL_JOB,

            [JobTypes.MODEL_OPTIMIZER_SCAN]: MODEL_WIZARD_STAGES.CONVERTING,
            [JobTypes.MODEL_OPTIMIZER_JOB]: MODEL_WIZARD_STAGES.CONVERTING,
            [JobTypes.OMZ_MODEL_CONVERT_JOB]: MODEL_WIZARD_STAGES.CONVERTING,
            [JobTypes.MODEL_ANALYZER_JOB]: MODEL_WIZARD_STAGES.CONVERTING,
            [JobTypes.ANALYZE_MODEL_INPUT_SHAPE_JOB]: MODEL_WIZARD_STAGES.CONVERTING,
            [JobTypes.OMZ_MODEL_MOVE_JOB]: MODEL_WIZARD_STAGES.CONVERTING,
          };

          nextStage = pageStagesModelRunningStagesMap[this.runningStage.stage] || null;
        } else {
          // Value of this.queuedStage will empty, when we open this page in edit mode
          if (!this.queuedStage) {
            nextStage = MODEL_WIZARD_STAGES.CONVERT_FORM;
            break;
          }

          const pageStagesModelQueuedStagesMap = {
            [JobTypes.WAIT_MODEL_UPLOAD_JOB]: MODEL_WIZARD_STAGES.UPLOAD,
            [JobTypes.SETUP_ENVIRONMENT_JOB]: MODEL_WIZARD_STAGES.PREPARING_ENVIRONMENT,
            [JobTypes.IMPORT_HUGGINGFACE_MODEL_JOB]: MODEL_WIZARD_STAGES.IMPORT_HUGGINGFACE_MODEL_JOB,
            [JobTypes.MODEL_OPTIMIZER_SCAN]: MODEL_WIZARD_STAGES.CONVERTING,

            [JobTypes.MODEL_OPTIMIZER_JOB]: MODEL_WIZARD_STAGES.CONVERT_FORM,
            [JobTypes.OMZ_MODEL_CONVERT_JOB]: MODEL_WIZARD_STAGES.CONVERT_FORM,
          };

          nextStage = pageStagesModelQueuedStagesMap[this.queuedStage.stage] || null;
        }

        break;

      case ProjectStatusNames.READY:
        if (this.model.isConfigured) {
          nextStage = MODEL_WIZARD_STAGES.DONE;
          break;
        }

        nextStage = [ProjectStatusNames.RUNNING, ProjectStatusNames.QUEUED].includes(this.configureStatus?.name)
          ? MODEL_WIZARD_STAGES.RESHAPING
          : MODEL_WIZARD_STAGES.RESHAPE_FORM;
        break;

      case ProjectStatusNames.ERROR:
        const errorStage = this.errorStage;
        const pageStagesModelErrorStagesMap = {
          [JobTypes.WAIT_MODEL_UPLOAD_JOB]: MODEL_WIZARD_STAGES.UPLOAD,
          [JobTypes.SETUP_ENVIRONMENT_JOB]: MODEL_WIZARD_STAGES.PREPARING_ENVIRONMENT,
          [JobTypes.IMPORT_HUGGINGFACE_MODEL_JOB]: MODEL_WIZARD_STAGES.IMPORT_HUGGINGFACE_MODEL_JOB,
          [JobTypes.MODEL_OPTIMIZER_SCAN]: MODEL_WIZARD_STAGES.CONVERTING,

          [JobTypes.MODEL_ANALYZER_JOB]: MODEL_WIZARD_STAGES.CONVERTING,
          [JobTypes.ANALYZE_MODEL_INPUT_SHAPE_JOB]: MODEL_WIZARD_STAGES.CONVERTING,
          [JobTypes.OMZ_MODEL_MOVE_JOB]: MODEL_WIZARD_STAGES.CONVERTING,

          [JobTypes.MODEL_OPTIMIZER_JOB]: MODEL_WIZARD_STAGES.CONVERT_FORM,
          [JobTypes.OMZ_MODEL_CONVERT_JOB]: MODEL_WIZARD_STAGES.CONVERT_FORM,
        };

        if (errorStage) {
          nextStage = pageStagesModelErrorStagesMap[errorStage.stage] || null;
        } else {
          // Show convert form if model.state = error by default
          nextStage = MODEL_WIZARD_STAGES.CONVERT_FORM;
        }
        break;
    }

    if (nextStage) {
      // Need to avoid checking the prepare environment stage and back to the conversion
      if (
        this.modelWizardStage === MODEL_WIZARD_STAGES.CONVERT_FORM &&
        nextStage === MODEL_WIZARD_STAGES.PREPARING_ENVIRONMENT
      ) {
        nextStage = MODEL_WIZARD_STAGES.CONVERT_FORM;
      }

      this.goToStage(nextStage);
    }
  }

  goToStage(stage: MODEL_WIZARD_STAGES): void {
    this.redirectAllowed = [
      MODEL_WIZARD_STAGES.CONVERTING,
      MODEL_WIZARD_STAGES.CONVERT_FORM,
      MODEL_WIZARD_STAGES.RESHAPE_FORM,
      MODEL_WIZARD_STAGES.DONE,
    ].includes(stage);

    if (stage === MODEL_WIZARD_STAGES.DONE) {
      this.toCreateProject();
      return;
    }

    this.modelWizardStage = stage;
  }

  handleUploadModelFiles({ model, precision }): void {
    this.redirectAllowed = false;
    const actionToDispatch =
      this.modelSource === ModelSources.OMZ
        ? ModelStoreActions.downloadOMZModel({
            model: model as ModelDownloaderDTO,
            precision,
          })
        : ModelStoreActions.startUploadModel({
            uploadingModel: model as UploadingModelDTO,
          });
    this._store$.dispatch(actionToDispatch);
  }

  handleUploadSavedModelFiles({ savedModel }): void {
    this._store$.dispatch(ModelStoreActions.startUploadModelDir({ modelFolder: savedModel }));
  }

  toCreateProject(): void {
    this._router.navigate(['projects/create'], { queryParamsHandling: 'preserve' });
  }

  handleConvertModel(convertFormValues: ModelConvertConfig, modelOptimizerJobId: number): void {
    if (this.isEdit || this.model.mo?.errorMessage) {
      const editConvertConfig: EditModelConvertConfigDTO = {
        ...convertFormValues,
        irId: this.model.id,
      };
      this._store$.dispatch(ModelStoreActions.editModelConvert({ editConvertConfig }));
    } else {
      this._store$.dispatch(
        ModelStoreActions.convertModel({
          convertConfig: {
            ...convertFormValues,
            modelOptimizerJobId,
          },
        })
      );
    }
  }

  getFinishedStage(stage: string): ProjectStatus {
    const status = ProjectStatus.createStatusByProgress(100);

    return { ...status, stage };
  }

  private _getStatusByName(status: ProjectStatusNames): ProjectStatus {
    if (!this.model?.stages?.length) {
      return null;
    }

    return this.model.stages?.find(({ name }) => name === status) || null;
  }

  isErrorStatus(status: ProjectStatus): boolean {
    return status ? status.name === ProjectStatusNames.ERROR : false;
  }

  reloadPage(): void {
    const [currentUrl] = this._router.url.split('?');
    const _defaultShouldReuseRoute = this._router.routeReuseStrategy.shouldReuseRoute;
    this._router.routeReuseStrategy.shouldReuseRoute = () => false;
    this._router.navigated = false;
    this._router.navigate([currentUrl]).then(() => {
      this._router.routeReuseStrategy.shouldReuseRoute = _defaultShouldReuseRoute;
    });
  }

  ngOnDestroy(): void {
    this._store$.dispatch(ModelStoreActions.resetImportingModel());
    this._store$.dispatch(ModelStoreActions.resetOMZModels());
    if (this.model) {
      this._store$.dispatch(
        ModelStoreActions.resetModelMOAnalyzedParams({
          modelId: this.model.id,
        })
      );
    }
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  handlePageLeave(): Observable<boolean> {
    const message = this._dialogService.dialogMessages.importModelMessage;

    return this._dialogService
      .openConfirmationDialog({ message })
      .afterClosed()
      .pipe(
        switchMap((res) => {
          if (res) {
            this._store$.dispatch(ModelStoreActions.cancelModelUpload({ id: this.model.id }));
          }
          return of(res);
        })
      );
  }

  onModelDetailsClick(model): void {
    this.selectedForDetailsModel = model;
    this.modelDetailsPanel.detailsSidenav.open();
  }

  hideModelDetails(): void {
    this.selectedForDetailsModel = null;
    this.modelDetailsPanel.detailsSidenav.close();
  }

  handleCancelEnvironment(): void {
    this._store$.dispatch(EnvironmentSetup.stop());
  }

  get modelOptimizerStageHeader(): string {
    return this.isIRModel ? this.stagesHeader.analyze : this.stagesHeader.convert;
  }

  get setupEnvironmentStage(): ProjectStatus {
    const defaultStatus = { progress: 0, name: ProjectStatusNames.QUEUED };

    if (!this.model?.stages?.length) {
      return defaultStatus;
    }
    const setupEnvironmentStage = this.model.stages.find(({ stage }) => JobTypes.SETUP_ENVIRONMENT_JOB === stage);
    if (!setupEnvironmentStage) {
      return defaultStatus;
    }

    return { ...setupEnvironmentStage, stage: this.progressStagesLabelsMap[setupEnvironmentStage.stage] };
  }

  get importFromHuggingfaceStage(): ProjectStatus {
    const stage = this.model?.stages?.find((i) => JobTypes.IMPORT_HUGGINGFACE_MODEL_JOB === i.stage);
    if (!stage) {
      return { progress: 0, name: ProjectStatusNames.QUEUED };
    }

    return { ...stage, stage: this.progressStagesLabelsMap[stage.stage] };
  }

  get convertingStage(): ProjectStatus {
    if (!this.model?.stages?.length) {
      return null;
    }

    const analyzingStageNames = [
      JobTypes.MODEL_OPTIMIZER_SCAN,
      JobTypes.MODEL_ANALYZER_JOB,
      JobTypes.MODEL_OPTIMIZER_JOB,
      JobTypes.ANALYZE_MODEL_INPUT_SHAPE_JOB,
      JobTypes.MODEL_OPTIMIZER_JOB,
      JobTypes.OMZ_MODEL_MOVE_JOB,
      JobTypes.OMZ_MODEL_CONVERT_JOB,
    ];
    const analyzingStages = this.model.stages.filter(({ stage: stg }) => analyzingStageNames.includes(stg as JobTypes));

    const queuedStage = analyzingStages.find(({ name }) => name === ProjectStatusNames.QUEUED);
    const runningStage = analyzingStages.find(({ name }) => name === ProjectStatusNames.RUNNING);
    const errorStage = analyzingStages.find(({ name }) => name === ProjectStatusNames.ERROR);

    const currentStage = [errorStage, runningStage, queuedStage].find((stage) => !!stage);

    return currentStage
      ? {
          ...currentStage,
          stage: this.progressStagesLabelsMap[currentStage.stage],
        }
      : null;
  }

  get reshapeStage(): ProjectStatus {
    const queuedStatus = { progress: 0, name: ProjectStatusNames.QUEUED };

    if (!this.model || !this.configureStatus?.stage) {
      return queuedStatus;
    }

    return { ...this.configureStatus, stage: this.progressStagesLabelsMap[this.configureStatus.stage] };
  }

  get runningStage(): ProjectStatus {
    return this._getStatusByName(this.projectStatusNames.RUNNING);
  }

  get errorStage(): ProjectStatus {
    return this._getStatusByName(this.projectStatusNames.ERROR);
  }

  get queuedStage(): ProjectStatus {
    return this._getStatusByName(this.projectStatusNames.QUEUED);
  }

  get isIRModel(): boolean {
    return this.model?.originalModelFramework === ModelFrameworks.OPENVINO || this.modelSource === ModelSources.IR;
  }

  get isHuggingFaceModel(): boolean {
    return this.modelSource === ModelSources.HUGGINGFACE;
  }

  get errorMessageTitle(): string {
    const failedStage = this.model?.stages?.find(({ name }) => name === ProjectStatusNames.ERROR);

    if (!failedStage) {
      return;
    }

    if ([failedStage.errorMessage, this.model?.status.errorMessage].includes(deprecatedIrVersionMessageKey)) {
      return this.deprecatedErrorMessageTitle;
    }

    return this._messagesService.getError(this._errorKey, failedStage?.stage) || this.modelImportFailedMessage;
  }

  getDetailedErrorMessage(error: string): string {
    return error === deprecatedIrVersionMessageKey ? this.deprecatedErrorMessageDescription : error;
  }
}
