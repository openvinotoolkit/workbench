import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Store } from '@ngrx/store';
import { combineLatest, Subject } from 'rxjs';
import { distinctUntilKeyChanged, filter, first, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { withLatestFrom } from 'rxjs/internal/operators/withLatestFrom';
import { isNumber } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';
import { Categories, GAActions, GoogleAnalyticsService } from '@core/services/common/google-analytics.service';
import { AnimationService, AnimationTargetElement } from '@core/services/common/animation.service';
import { NotificationType } from '@core/services/common/notification.service';

import {
  getSelectedProjectByRouteParam,
  selectChildProjects,
  selectParentProject,
} from '@store/project-store/project.selectors';
import {
  DatasetStoreSelectors,
  ExportInferenceResultStoreActions,
  ExportReportActions,
  GlobalsStoreSelectors,
  InferenceHistoryStoreActions,
  InferenceHistoryStoreSelectors,
  InferenceResultStoreActions,
  InferenceResultStoreSelectors,
  ModelStoreActions,
  ProjectStoreActions,
  ProjectStoreSelectors,
  RootStoreState,
  TargetMachineSelectors,
} from '@store';
import { selectParamModelId, selectParamProjectId } from '@store/router-store/route.selectors';
import {
  OptimizationAlgorithm,
  OptimizationAlgorithmPreset,
  optimizationJobNamesMap,
  ProjectItem,
  ProjectStatus,
  ProjectStatusNames,
} from '@store/project-store/project.model';
import {
  selectRunningInferenceOverlayId,
  selectRunningProfilingPipelinesPerProjectMap,
} from '@store/inference-history-store/inference-history.selectors';
import { selectSelectedProjectModel } from '@store/model-store/model.selectors';
import { startExportProject } from '@store/project-store/export-project.actions';
import { IInferenceResult } from '@store/inference-history-store/inference-history.model';
import { XMLGraphStoreActions, XMLGraphStoreSelectors, XMLGraphStoreState } from '@store/xml-graph-store';
import { IInferenceExecutionInfo } from '@store/inference-result-store/inference-result.model';
import { loadInferenceHistory } from '@store/inference-history-store/inference-history.actions';
import { ModelDomain, ModelPrecisionEnum } from '@store/model-store/model.model';

import {
  AccuracyPipelineStages,
  CalibrationPipelineStages,
  PipelineStage,
  ProfilingPipelineStages,
} from '@shared/models/pipelines/pipeline';
import { CompoundInferenceConfig } from '@shared/models/compound-inference-config';

import {
  ANALYZE_PERFORMANCE_RIBBON_IDS,
  ANALYZE_RIBBON_IDS,
  LEARN_OPENVINO_RIBBON_IDS,
  PERFORM_RIBBON_IDS,
} from '../../constants';
import { PrecisionAnalysisAdvisorService } from '../../components/precision-analysis/precision-analysis-advisor/precision-analysis-advisor.service';
import { StartExportProjectEvent } from '../../components/project-export/project-export.component';
import { SampleTutorialType } from '../../components/open-sample-tutorial/open-sample-tutorial.component';

export enum DashboardTab {
  ANALYSE,
  PERFORM,
  DETAILS,
  LEARN_OPENVINO,
}

interface IRouteState {
  tab: DashboardTab;
  ribbon: ANALYZE_RIBBON_IDS | PERFORM_RIBBON_IDS;
}

@Component({
  selector: 'wb-dashboard-new-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements AfterViewChecked, OnDestroy, OnInit {
  readonly projectStatusNames = ProjectStatusNames;
  readonly pipelineStage = PipelineStage;
  readonly NotificationType = NotificationType;

  public selectedDashboardTabIndex = DashboardTab.ANALYSE;

  readonly ANALYZE_RIBBON_IDS = ANALYZE_RIBBON_IDS;
  readonly ANALYZE_PERFORMANCE_RIBBON_IDS = ANALYZE_PERFORMANCE_RIBBON_IDS;
  readonly PERFORM_RIBBON_IDS = PERFORM_RIBBON_IDS;
  readonly LEARN_OPENVINO_RIBBON_IDS = LEARN_OPENVINO_RIBBON_IDS;

  readonly analyzeRibbonValues = [
    { id: ANALYZE_RIBBON_IDS.PERFORMANCE, title: 'Performance' },
    { id: ANALYZE_RIBBON_IDS.ACCURACY, title: 'Accuracy' },
  ];
  public selectedAnalyzeRibbonValue = this.analyzeRibbonValues[0].id;

  readonly analyzePerformanceRibbonValues = [
    { id: ANALYZE_PERFORMANCE_RIBBON_IDS.METRICS, title: 'Performance Summary' },
    { id: ANALYZE_PERFORMANCE_RIBBON_IDS.PRECISION, title: 'Precision-Level Performance' },
    { id: ANALYZE_PERFORMANCE_RIBBON_IDS.KERNEL, title: 'Kernel-Level Performance' },
  ];
  public selectedAnalyzePerformanceRibbonValue = this.analyzePerformanceRibbonValues[0].id;

  readonly performRibbonValues = [
    { id: PERFORM_RIBBON_IDS.OPTIMIZE, title: 'Optimize Performance' },
    { id: PERFORM_RIBBON_IDS.TUNE, title: 'Explore Inference Configurations' },
    { id: PERFORM_RIBBON_IDS.CREATE_ACCURACY_REPORT, title: 'Create Accuracy Report' },
    { id: PERFORM_RIBBON_IDS.TEST, title: 'Visualize Output' },
    { id: PERFORM_RIBBON_IDS.CREATE, title: 'Create Deployment Package' },
    { id: PERFORM_RIBBON_IDS.EXPORT, title: 'Export Project' },
  ];
  public selectedPerformRibbonValue = this.performRibbonValues[0].id;

  readonly learnOpenvinoRibbonValues = [
    { id: LEARN_OPENVINO_RIBBON_IDS.GENERATED_TUTORIAL, title: 'Model Workflow with OpenVINO CLI' },
    { id: LEARN_OPENVINO_RIBBON_IDS.SAMPLE_TUTORIAL, title: 'Model Inference with OpenVINO API' },
    { id: LEARN_OPENVINO_RIBBON_IDS.OPENVINO_NOTEBOOKS, title: 'OpenVINO Notebooks' },
  ];
  selectedLearnOpenvinoRibbonValue = this.learnOpenvinoRibbonValues[0].id;

  public selectedSampleTutorialType = SampleTutorialType.PYTHON_API;

  readonly optimizationJobNamesMap = optimizationJobNamesMap;

  readonly project$ = this.store$.select(getSelectedProjectByRouteParam);
  readonly parentProject$ = this.store$.select(selectParentProject);
  readonly childProjects$ = this.store$.select(selectChildProjects);
  readonly inferenceItems$ = this.store$.select(InferenceHistoryStoreSelectors.selectAllInferenceItems);
  readonly readyInferenceItems$ = this.store$.select(InferenceHistoryStoreSelectors.selectExecutedFilteredPoints);
  readonly bestInferenceResult$ = this.store$.select(InferenceHistoryStoreSelectors.selectBestInferenceHistoryExecInfo);
  readonly hiddenInferences$ = this.store$.select(InferenceHistoryStoreSelectors.selectHiddenInferenceItems);
  readonly inferenceReportGenerating$ = this.store$.select(
    InferenceResultStoreSelectors.selectInferenceReportGenerating
  );
  readonly optimizations$ = this.project$.pipe(
    filter((project: ProjectItem) => !!project),
    switchMap(({ targetId }: ProjectItem) =>
      this.store$.select(TargetMachineSelectors.selectAvailableOptimizationsForTarget, targetId)
    )
  );
  readonly isInt8Available$ = this.project$.pipe(
    filter((project) => !!project),
    switchMap(({ targetId, deviceId }) =>
      this.store$.select(TargetMachineSelectors.selectAvailableOptimizationsForTarget, targetId).pipe(
        map((optimizationsMap) => optimizationsMap[deviceId]),
        filter((optimizations) => !!optimizations)
      )
    ),
    map((optimizations) => optimizations.includes(ModelPrecisionEnum.I8))
  );
  readonly runtimeGraph$ = this.store$.select(XMLGraphStoreSelectors.selectRuntimeGraph);
  readonly originalGraph$ = this.store$.select(XMLGraphStoreSelectors.selectOriginalGraph);
  readonly devicesNamesMap$ = this.store$.select(TargetMachineSelectors.selectAllDevicesNamesMap);

  readonly selectedProjectModel$ = this.store$.select(selectSelectedProjectModel);
  readonly selectedProjectDataset$ = this.project$.pipe(
    filter((project) => !!project),
    switchMap((project) => this.store$.select(DatasetStoreSelectors.selectDatasetById, project.datasetId))
  );
  readonly selectedInferenceResult$ = this.store$.select(InferenceResultStoreSelectors.selectSelectedInferenceResult);
  readonly selectedTargetMachine$ = this.project$.pipe(
    filter((project) => !!project),
    switchMap((project) => this.store$.select(TargetMachineSelectors.selectTargetMachineById, project.targetId))
  );

  readonly projectReportGenerating$ = this.store$.select(ProjectStoreSelectors.selectProjectReportGenerating);

  readonly runningProfilingPipeLinePerProjectMap$ = this.store$.select(selectRunningProfilingPipelinesPerProjectMap);
  readonly runningInt8CalibrationPipeLinePerProjectMap$ = this.store$.select(
    ProjectStoreSelectors.selectRunningInt8CalibrationPipelinesPerProjectMap
  );

  readonly isTaskRunning$ = this.store$.select(GlobalsStoreSelectors.selectTaskIsRunning);
  readonly isInferenceOverlayOpened$ = this.store$.select(selectRunningInferenceOverlayId).pipe(map((v) => !!v));
  readonly isJupyterAvailable$ = this.store$.select(GlobalsStoreSelectors.selectIsJupyterAvailable);
  private readonly _isDevCloudNotAvailable$ = this.store$.select(GlobalsStoreSelectors.selectIsDevCloudNotAvailable);

  readonly areProjectPipelinesCompleted$ = this.project$.pipe(
    withLatestFrom(this.runningProfilingPipeLinePerProjectMap$, this.runningInt8CalibrationPipeLinePerProjectMap$),
    map(
      ([project, profilingPipeline, int8CalibrationPipeline]) =>
        !profilingPipeline?.[project?.id] && !int8CalibrationPipeline?.[project?.id]
    )
  );
  readonly isVisualizationEnabled$ = this.project$.pipe(
    withLatestFrom(this.areProjectPipelinesCompleted$),
    map(
      ([project, areProjectPipelinesCompleted]) =>
        project?.status.name === ProjectStatusNames.READY && areProjectPipelinesCompleted
    )
  );

  readonly profilingOptimizationDisabled$ = combineLatest([this.isTaskRunning$, this._isDevCloudNotAvailable$]).pipe(
    tap<[boolean, boolean]>(([isTaskRunning, isDevCloudNotAvailable]) => {
      if (!isTaskRunning && !isDevCloudNotAvailable) {
        this.profilingOptimizationDisabledMessage = null;
        return;
      }
      this.profilingOptimizationDisabledMessage = isTaskRunning
        ? this.messagesService.tooltipMessages.global.taskIsRunning
        : this.messagesService.hintMessages.devCloud.notRespondingWarning;
    }),
    map(([isTaskRunning, isDevCloudNotAvailable]) => isTaskRunning || isDevCloudNotAvailable)
  );

  public profilingOptimizationDisabledMessage: string = null;
  public readonly archivedTipMessage = this.messagesService.getHint('common', 'archivedProjectWarning', {
    actionName: 'Create button',
  });
  public readonly inferenceReportTipMessage = this.messagesService.getHint('common', 'downloadReport', {
    reportName: 'inference',
  });
  public readonly analysisUnavailableTipMessage = this.messagesService.hintMessages.precisionAnalysis
    .analysisUnavailable;
  public readonly autoBenchmarkHintMessage = this.messagesService.hintMessages.autoBenchmark.defaultOptimalParameters;

  public readonly selectTokenizerHint$ = combineLatest([
    this.selectedProjectModel$,
    this.selectedInferenceResult$,
  ]).pipe(
    map(([model, inferenceResult]) => {
      const isNLP = model?.domain === ModelDomain.NLP;
      const isAutogenerated = inferenceResult?.execInfo?.autogenerated;
      if (!isNLP || !isAutogenerated) {
        return;
      }

      const isTokenizerSelected = isNumber(model?.selectedTokenizerId);
      if (isTokenizerSelected) {
        return this.messagesService.getHint('tokenizer', 'autogenerated');
      }
      return this.messagesService.getHint('tokenizer', 'selectForRealData', { modelId: model.id });
    })
  );

  public benchmarkChartExpanded = false;
  public inferenceHistoryTableExpanded = false;
  public selectedPointExpanded = true;
  public layerSummaryTableExpanded = false;
  public hasAdvisingMessages = false;
  public hasSuccessfulOrProcessingInference = false;
  public isInferenceRunning = false;

  readonly taskIsRunningMessage = this.messagesService.tooltipMessages.global.taskIsRunning;
  readonly onlyCanceledProfilingMessage = this.messagesService.hintMessages.common.onlyCanceledProfiling;

  private readonly _unsubscribe$ = new Subject();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private store$: Store<RootStoreState.State>,
    private messagesService: MessagesService,
    private precisionAnalysisAdvisorService: PrecisionAnalysisAdvisorService,
    private googleAnalyticsService: GoogleAnalyticsService,
    private animationService: AnimationService,
    private el: ElementRef
  ) {
    this.applyRouterTabsState();
  }

  ngOnInit(): void {
    this.store$
      .select(selectParamModelId)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((modelId) => {
        this.store$.dispatch(ProjectStoreActions.loadProjectsForModel({ modelId }));
      });

    this.store$
      .select(selectParamProjectId)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((projectId) => {
        this.store$.dispatch(ProjectStoreActions.selectProject({ id: projectId }));
      });

    const loadGraphContentFilterPredicate = ({
      id,
      xmlContent,
      isLoading,
    }: XMLGraphStoreState.BaseGraphState): boolean => id && !xmlContent && !isLoading;

    this.runtimeGraph$.pipe(takeUntil(this._unsubscribe$), filter(loadGraphContentFilterPredicate)).subscribe(() => {
      this.store$.dispatch(XMLGraphStoreActions.loadRuntimeGraphAction());
    });

    this.project$
      .pipe(
        filter((project: ProjectItem) => !!project),
        distinctUntilKeyChanged('id'),
        takeUntil(this._unsubscribe$)
      )
      .subscribe(({ modelId }: ProjectItem) => {
        this.store$.dispatch(ModelStoreActions.loadSelectedModelById({ id: modelId }));
      });

    // TODO: Consider merging duplicated subscribe for `project$` selector
    this.project$
      .pipe(
        filter((project: ProjectItem) => !!project),
        first()
      )
      .subscribe(({ id, modelId }: ProjectItem) => {
        this.store$.dispatch(XMLGraphStoreActions.setOriginalGraphIdAction({ modelId }));
        this.store$.dispatch(loadInferenceHistory({ id }));
      });

    this.precisionAnalysisAdvisorService.hasAdvices$.pipe(takeUntil(this._unsubscribe$)).subscribe((value) => {
      this.hasAdvisingMessages = value;
    });

    this.inferenceItems$.pipe(takeUntil(this._unsubscribe$)).subscribe((items) => {
      this.hasSuccessfulOrProcessingInference =
        items.length > 0 &&
        !!items?.find((item) => ![ProjectStatusNames.CANCELLED, ProjectStatusNames.ERROR].includes(item.status.name));

      this.isInferenceRunning = !!items?.find((inference) =>
        [ProjectStatusNames.RUNNING, ProjectStatusNames.QUEUED].includes(inference.status.name)
      );
    });
  }

  ngAfterViewChecked(): void {
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.store$.dispatch(ProjectStoreActions.resetSelectedProject());
    this.store$.dispatch(InferenceResultStoreActions.resetSelectedInferenceResult());
    this.store$.dispatch(InferenceHistoryStoreActions.resetInferenceHistory());
    this.store$.dispatch(XMLGraphStoreActions.resetGraphsAction());
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  applyRouterTabsState(): void {
    const routerState = this.router.getCurrentNavigation()?.extras.state as IRouteState;

    if (routerState) {
      this.selectedDashboardTabIndex = routerState.tab;
      if (this.selectedDashboardTabIndex === DashboardTab.ANALYSE) {
        this.selectedAnalyzeRibbonValue = routerState.ribbon as ANALYZE_RIBBON_IDS;
      }
      if (this.selectedDashboardTabIndex === DashboardTab.PERFORM) {
        this.selectedPerformRibbonValue = routerState.ribbon as PERFORM_RIBBON_IDS;
      }
    }
  }

  selectDashboardTabAndPerformRibbon(tab: DashboardTab, performRibbon: PERFORM_RIBBON_IDS): void {
    this.selectedDashboardTabIndex = tab;
    this.selectedPerformRibbonValue = performRibbon;
    this.cdr.detectChanges();
    this.el.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  goToCompare(project: ProjectItem): void {
    this.router.navigate(['dashboard', project.originalModelId, 'compare'], { queryParams: { projectA: project.id } });
  }

  goToFailedToolPage(project: ProjectItem): void {
    this.parentProject$.pipe(first()).subscribe((parentProject) => {
      const { id } = project;
      const { stage } = project.status;

      if (AccuracyPipelineStages.includes(stage as PipelineStage)) {
        this.goToAccuracyConfig(project);
      }
      if (stage === PipelineStage.EXPORT_PROJECT) {
        this.selectDashboardTabAndPerformRibbon(DashboardTab.PERFORM, PERFORM_RIBBON_IDS.EXPORT);
      }
      if (ProfilingPipelineStages.includes(stage as PipelineStage)) {
        this.selectDashboardTabAndPerformRibbon(DashboardTab.PERFORM, PERFORM_RIBBON_IDS.TUNE);
      }
      if (CalibrationPipelineStages.includes(stage as PipelineStage) && parentProject) {
        this.goToEditCalibration(parentProject, id);
      }
    });
  }

  goToAccuracyConfig({ id, originalModelId }: ProjectItem): void {
    this.router.navigate(['projects', 'edit-accuracy', 'models', originalModelId, 'projects', id]);
  }

  goToEditCalibration({ id, modelId }: ProjectItem, childrenId = null): void {
    this.router.navigate(['projects', 'edit-calibration', id], {
      queryParams: {
        optimization: OptimizationAlgorithm.DEFAULT,
        preset: OptimizationAlgorithmPreset.PERFORMANCE,
        modelId: childrenId ? modelId : null,
        projectId: childrenId,
      },
    });
  }

  goToModel(): void {
    this.project$.pipe(take(1)).subscribe(({ originalModelId }) => this.router.navigate(['models', originalModelId]));
  }

  goToProject({ id, originalModelId }: ProjectItem): void {
    this.router.navigate(['dashboard', originalModelId, 'projects', id]);
  }

  goToConfigureCalibration({ id, modelId }: ProjectItem, childrenId = null): void {
    this.router.navigate(['projects', 'edit-calibration', id], {
      queryParams: {
        optimization: OptimizationAlgorithm.DEFAULT,
        preset: OptimizationAlgorithmPreset.PERFORMANCE,
        modelId: childrenId ? modelId : null,
        projectId: childrenId,
      },
    });
  }

  deleteProject({ id, originalModelId }: ProjectItem): void {
    this.store$.dispatch(ProjectStoreActions.deleteProject({ id }));
    this.router.navigate(['models', originalModelId]);
  }

  getProjectErrorMessage(status: ProjectStatus): string {
    const parameterName = ProjectStatus.getStatusStageErrorKey(status);

    return this.messagesService.errorMessages.projectStatus[parameterName];
  }

  exportReport(): void {
    this.store$.dispatch(ExportReportActions.startExportProjectReport());
  }

  handleRunInference(config: CompoundInferenceConfig): void {
    this.isInferenceRunning = true;
    this.store$.dispatch(
      InferenceHistoryStoreActions.addRunInferenceRequest({
        config: new CompoundInferenceConfig(config),
      })
    );
    this.selectedDashboardTabIndex = DashboardTab.ANALYSE;
    this.selectedAnalyzeRibbonValue = ANALYZE_RIBBON_IDS.PERFORMANCE;
  }

  handleStartExportProject({ projectId, config }: StartExportProjectEvent): void {
    this.store$.dispatch(startExportProject({ projectId, config }));
  }

  handleSelectInferResultFromTable(point: IInferenceResult): void {
    this.googleAnalyticsService.emitEvent(GAActions.SELECT_INFERENCE, Categories.INFERENCE_TABLE);
    this._handleGraphPointChange(point);
  }

  handleSelectInferResultFromGraph(point: IInferenceResult): void {
    this.googleAnalyticsService.emitEvent(GAActions.SELECT_INFERENCE, Categories.INFERENCE_CHART);
    this._handleGraphPointChange(point);
  }

  handleCancelInference(jobId: number): void {
    this.store$.dispatch(InferenceHistoryStoreActions.cancelInference({ jobId }));
  }

  private _handleGraphPointChange(point: IInferenceResult): void {
    this.store$.dispatch(
      InferenceResultStoreActions.setSelectedInferenceResult({
        jobId: point.profilingJobId,
        inferenceResultId: point.id,
      })
    );
  }

  handleChangeVisibilityInferenceItems(inferenceIdList: number[]): void {
    this.store$.dispatch(InferenceHistoryStoreActions.filterInferenceItemsPoints({ ids: inferenceIdList }));
  }

  handleExportPerLayerReport(): void {
    this.store$.dispatch(ExportInferenceResultStoreActions.startExportInferenceResultReport());
  }

  handleDispatchLoadOriginalGraphAction(): void {
    console.log('== loadOriginalGraphAction');
    this.store$.dispatch(XMLGraphStoreActions.loadOriginalGraphAction());
  }

  async navigateAndScrollToAdvice(): Promise<void> {
    if (
      ![ANALYZE_PERFORMANCE_RIBBON_IDS.PRECISION, ANALYZE_PERFORMANCE_RIBBON_IDS.METRICS].includes(
        this.selectedAnalyzePerformanceRibbonValue
      )
    ) {
      this.selectedAnalyzePerformanceRibbonValue = ANALYZE_PERFORMANCE_RIBBON_IDS.PRECISION;
      this.cdr.detectChanges();
    }

    this.animationService.highlight(AnimationTargetElement.ADVISOR);
  }

  toInferenceExecutionInfoType(info: IInferenceExecutionInfo): IInferenceExecutionInfo {
    return info as IInferenceExecutionInfo;
  }

  onCreateReport(): void {
    this.selectedDashboardTabIndex = DashboardTab.ANALYSE;
    this.selectedAnalyzeRibbonValue = ANALYZE_RIBBON_IDS.ACCURACY;
  }

  onOpenCreateReport(): void {
    this.selectedDashboardTabIndex = DashboardTab.PERFORM;
    this.selectedPerformRibbonValue = PERFORM_RIBBON_IDS.CREATE_ACCURACY_REPORT;
  }

  openSampleTutorialRibbonContent(): void {
    this.selectedSampleTutorialType = SampleTutorialType.CPP_API;
    this.selectedDashboardTabIndex = DashboardTab.LEARN_OPENVINO;
    this.selectedLearnOpenvinoRibbonValue = LEARN_OPENVINO_RIBBON_IDS.SAMPLE_TUTORIAL;
  }

  rerunCanceledInference(): void {
    this.project$.pipe(take(1)).subscribe(({ modelId, datasetId, deviceId, targetId, deviceName }) => {
      const inferenceConfig: Partial<CompoundInferenceConfig> = {
        modelId: Number(modelId),
        datasetId: Number(datasetId),
        deviceId,
        deviceName,
        inferences: [{ nireq: 1, batch: 1 }],
        targetId,
      };

      this.handleRunInference(new CompoundInferenceConfig(inferenceConfig));
    });
  }
}
