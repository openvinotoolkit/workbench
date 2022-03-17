import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { Store } from '@ngrx/store';
import { distinctUntilKeyChanged, filter, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';

import { MessagesService } from '@core/services/common/messages.service';
import { AccuracyRestService } from '@core/services/api/rest/accuracy.service';
import { GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import {
  AccuracyAnalysisStoreActions,
  AccuracyAnalysisStoreSelectors,
  InferenceTestImageStoreActions,
  ProjectStoreSelectors,
  RootStoreState,
} from '@store';
import { ProjectItem, ProjectStatusNames } from '@store/project-store/project.model';
import { ModelItem, ModelTaskTypes } from '@store/model-store/model.model';
import { ITestImage } from '@store/inference-test-image-store/inference-test-image-models';
import { DatasetItem } from '@store/dataset-store/dataset.model';
import { IAccuracyPipeline } from '@store/accuracy-analysis-store/accuracy-analysis-store.models';

import { PipelineType } from '@shared/models/pipelines/pipeline';
import { IParameter } from '@shared/components/model-details/parameter-details/parameter-details.component';
import { AccuracyReportType, IAccuracyReport, IOutputMSEInfo } from '@shared/models/accuracy-analysis/accuracy-report';

import { AccuracyReportTypeControlOptions } from '../accuracy-report-type-radio-group/accuracy-report-type-radio-group.component';
import { VisualizationMode } from '../../../accuracy/components/visualization/network-output/network-output.component';
import { ClassificationAccuracyReportTableComponent } from '../../../accuracy/components/classification-accuracy-report-table/classification-accuracy-report-table.component';
import { DetectionAccuracyReportTableComponent } from '../../../accuracy/components/detection-accuracy-report-table/detection-accuracy-report-table.component';
import { PerTensorAccuracyReportTableComponent } from '../../../accuracy/components/per-tensor-accuracy-report-table/per-tensor-accuracy-report-table.component';

export interface IReportTableVisualizeEvent {
  imageName: string;
  datasetId: number;
  testImage: ITestImage;
}

export interface IPerTensorReportTableVisualizeEvent {
  imageName: string;
  outputsMSEInfo: IOutputMSEInfo[];
}

export const PIPELINE_TYPE_TO_REPORT_TYPE_MAP = {
  [PipelineType.LOCAL_ACCURACY]: AccuracyReportType.DATASET_ANNOTATIONS,
  [PipelineType.REMOTE_ACCURACY]: AccuracyReportType.DATASET_ANNOTATIONS,
  [PipelineType.DEV_CLOUD_ACCURACY]: AccuracyReportType.DATASET_ANNOTATIONS,
  [PipelineType.LOCAL_ACCURACY_PARENT_MODEL_PREDICTIONS]: AccuracyReportType.PARENT_MODEL_PREDICTIONS,
  [PipelineType.REMOTE_ACCURACY_PARENT_MODEL_PREDICTIONS]: AccuracyReportType.PARENT_MODEL_PREDICTIONS,
  [PipelineType.DEV_CLOUD_ACCURACY_PARENT_MODEL_PREDICTIONS]: AccuracyReportType.PARENT_MODEL_PREDICTIONS,
  [PipelineType.LOCAL_ACCURACY_PARENT_MODEL_TENSOR_DISTANCE]: AccuracyReportType.PARENT_MODEL_PER_TENSOR,
  [PipelineType.REMOTE_ACCURACY_PARENT_MODEL_TENSOR_DISTANCE]: AccuracyReportType.PARENT_MODEL_PER_TENSOR,
  [PipelineType.DEV_CLOUD_ACCURACY_PARENT_MODEL_TENSOR_DISTANCE]: AccuracyReportType.PARENT_MODEL_PER_TENSOR,
};

@Component({
  selector: 'wb-analyze-accuracy-ribbon-content',
  templateUrl: './analyze-accuracy-ribbon-content.component.html',
  styleUrls: ['./analyze-accuracy-ribbon-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyzeAccuracyRibbonContentComponent
  extends AccuracyReportTypeControlOptions
  implements OnInit, OnDestroy {
  @Input() projectId: number = null;

  private _model: ModelItem = null;
  @Input() set model(value: ModelItem) {
    this._model = value;
    this._updateOptionsValidity();
  }

  private _dataset: DatasetItem = null;
  @Input() set dataset(value: DatasetItem) {
    this._dataset = value;
    this._updateOptionsValidity();
  }

  private _isInt8Available = false;
  @Input() set isInt8Available(value: boolean) {
    this._isInt8Available = value;
    this._updateOptionsValidity();
  }

  @Output() openCreateReport = new EventEmitter<void>();

  private readonly _project$ = this._store$.select(ProjectStoreSelectors.selectSelectedProject);

  private readonly _reports$ = this._store$.select(AccuracyAnalysisStoreSelectors.selectAccuracyReports);

  accuracyPipeline$: Observable<IAccuracyPipeline> = null;

  readonly ModelTaskTypes = ModelTaskTypes;

  project: ProjectItem = null;
  accuracyResultParameter: IParameter = null;

  readonly hints = this.messagesService.hintMessages.analyzeAccuracyReportRibbon;

  readonly AccuracyReportType = AccuracyReportType;

  readonly reportMetricControl = new FormControl(null, Validators.required);

  datasetImage: File = null;

  outputsMSEInfo: IOutputMSEInfo[] = null;

  @ViewChild('accuracyReportTable')
  private set _accuracyReportTableComponent(
    reportTable:
      | ClassificationAccuracyReportTableComponent
      | DetectionAccuracyReportTableComponent
      | PerTensorAccuracyReportTableComponent
  ) {
    if (!reportTable) {
      return;
    }
    // Reset visualized image on fetching new entities (e.g. filtering)
    reportTable.dataSource.loading$
      .pipe(
        filter((isLoading) => !!isLoading),
        takeUntil(this._unsubscribe$)
      )
      .subscribe(() => (this.datasetImage = null));
  }

  @ViewChild('imageVisualization', { read: ElementRef }) private _imageVisualizationElement: ElementRef;

  private _reports: IAccuracyReport[] = null;
  set reports(value: IAccuracyReport[]) {
    this._reports = value;
    this._updateOptionsValidity();
    this._autoSelectReportMetric();
  }

  get reports(): IAccuracyReport[] {
    return this._reports;
  }

  private readonly _unsubscribe$ = new Subject<void>();

  constructor(
    private _accuracyRestService: AccuracyRestService,
    private _store$: Store<RootStoreState.State>,
    private _cdr: ChangeDetectorRef,
    private _gAnalyticsService: GoogleAnalyticsService,
    public messagesService: MessagesService
  ) {
    super(messagesService);

    this.accuracyReportTypeControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe(() => {
      this._autoSelectReportMetric();
    });
  }

  ngOnInit(): void {
    this._project$
      .pipe(
        filter((project) => !!project),
        distinctUntilKeyChanged('id'),
        takeUntil(this._unsubscribe$)
      )
      .subscribe((project) => {
        this.project = project;
        this._store$.dispatch(AccuracyAnalysisStoreActions.loadAccuracyReports({ projectId: project.id }));
      });

    this.accuracyPipeline$ = this._store$.select(
      AccuracyAnalysisStoreSelectors.selectRunningAccuracyPipeline(this.projectId)
    );

    this.accuracyPipeline$
      .pipe(
        takeUntil(this._unsubscribe$),
        filter((pipeline) => !!pipeline)
      )
      .subscribe((pipeline) => {
        const isRunning = [ProjectStatusNames.RUNNING, ProjectStatusNames.QUEUED].includes(pipeline.status.name);
        if (!isRunning) {
          this._store$.dispatch(AccuracyAnalysisStoreActions.loadAccuracyReports({ projectId: pipeline.projectId }));
          const reportType = PIPELINE_TYPE_TO_REPORT_TYPE_MAP[pipeline.type];
          if (!this.accuracyReportOptions[reportType].disabled) {
            this.accuracyReportTypeControl.setValue(reportType);
          }
        } else if (this.areReportsAvailable) {
          this._store$.dispatch(AccuracyAnalysisStoreActions.resetAccuracyReports());
        }
      });

    this._reports$.pipe(takeUntil(this._unsubscribe$)).subscribe((reports) => {
      this.reports = reports;
      this._cdr.markForCheck();
    });

    this.reportMetricControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((report: IAccuracyReport) => {
      const accuracyPostfix = report.accuracyPostfix ? ` ${report.accuracyPostfix}` : '';
      this.accuracyResultParameter = {
        label: 'Accuracy',
        // todo: Update tooltip
        tooltip: 'Accuracy Result',
        value: `${report.accuracyResult}${accuracyPostfix}`,
      };
      this.datasetImage = null;
    });
  }

  get areReportsAvailable(): boolean {
    return Boolean(this.reports?.length);
  }

  get reportsOfSelectedType(): IAccuracyReport[] {
    return this.reports?.filter(({ reportType }) => reportType === this.accuracyReportTypeControl.value);
  }

  getVisualizationMode(reportType: AccuracyReportType): VisualizationMode {
    if (reportType === AccuracyReportType.DATASET_ANNOTATIONS) {
      return 'dataset_annotations';
    }

    if (reportType === AccuracyReportType.PARENT_MODEL_PREDICTIONS) {
      return 'parent_model_predictions';
    }

    return 'default';
  }

  async visualizePredictions({ imageName, datasetId, testImage }: IReportTableVisualizeEvent): Promise<void> {
    await this.fetchImage(imageName, datasetId);
    this._store$.dispatch(InferenceTestImageStoreActions.setTestImage({ data: testImage }));
    this._scrollToImageVisualization();
    this._gAnalyticsService.emitAccuracyReportVisualizationEvent(this.accuracyReportTypeControl.value);
  }

  async visualizeImageMSE(
    { imageName, outputsMSEInfo }: IPerTensorReportTableVisualizeEvent,
    targetDatasetId: number
  ): Promise<void> {
    this.outputsMSEInfo = outputsMSEInfo;
    await this.fetchImage(imageName, targetDatasetId);
    this._scrollToImageVisualization();
    this._gAnalyticsService.emitAccuracyReportVisualizationEvent(this.accuracyReportTypeControl.value);
  }

  async fetchImage(imageName: string, targetDatasetId: number): Promise<void> {
    const image = await this._accuracyRestService.getDatasetImage$(targetDatasetId, imageName).toPromise();

    this.datasetImage = new File([image], imageName, { type: image.type });
    this._cdr.detectChanges();
  }

  private _scrollToImageVisualization(): void {
    this._cdr.detectChanges();

    this._imageVisualizationElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private _updateOptionsValidity(): void {
    if (!this.reports) {
      return;
    }

    for (const reportType of this.accuracyReportTypes) {
      this.disableReportType(reportType, this.hints.reportNotReadyYetShort);
    }

    for (const report of this.reports) {
      const { reportType } = report;
      this.enableReportType(reportType);
    }

    this.setOptionsValidity(this._model, this._dataset, this.projectId, this._isInt8Available);

    this.selectAvailableReportType();
  }

  private _autoSelectReportMetric(): void {
    const reports = this.reportsOfSelectedType;
    if (!reports?.length) {
      return;
    }
    this.reportMetricControl.setValue(reports[0]);
    if (reports.length === 1) {
      this.reportMetricControl.disable();
    } else {
      this.reportMetricControl.enable();
    }

    this.datasetImage = null;
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
    this._store$.dispatch(AccuracyAnalysisStoreActions.resetAccuracyReports());
  }
}
