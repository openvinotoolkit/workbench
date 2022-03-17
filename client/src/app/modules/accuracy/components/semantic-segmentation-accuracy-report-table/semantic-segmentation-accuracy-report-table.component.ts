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
import { HttpParams } from '@angular/common/http';

import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { isNumber } from 'lodash';

import { AccuracyRestService, IPage } from '@core/services/api/rest/accuracy.service';

import { ITestImage } from '@store/inference-test-image-store/inference-test-image-models';

import {
  AccuracyReportType,
  DetectionReportEntityKey,
  IAccuracyReport,
  IAggregatedSemanticSegmentationReportEntity,
  ISemanticSegmentationReportEntity,
  SemanticSegmentationReportEntityKey,
} from '@shared/models/accuracy-analysis/accuracy-report';
import { FilterableColumn } from '@shared/components/table-filter-form/filter-form.model';

import { DynamicTableColumn } from '../dynamic-table/dynamic-table.model';
import { IReportTableVisualizeEvent } from '../../../dashboard/components/analyze-accuracy-ribbon-content/analyze-accuracy-ribbon-content.component';
import { EntitiesDataSource } from '../dynamic-table/entities-data-source';

const ADVANCED_COLUMN_HEADERS_NAMES = {
  [SemanticSegmentationReportEntityKey.IMAGE_NAME]: {
    [AccuracyReportType.DATASET_ANNOTATIONS]: 'Image Name',
    [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'Image Name',
  },
  [SemanticSegmentationReportEntityKey.CLASS_ID]: {
    [AccuracyReportType.DATASET_ANNOTATIONS]: 'Class Predicted by Model',
    [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'Class Predicted by Optimized Model',
  },
  [SemanticSegmentationReportEntityKey.RESULT]: {
    [AccuracyReportType.DATASET_ANNOTATIONS]: 'Model Result',
    [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'Optimized Model Result',
  },
};

const BASIC_COLUMN_HEADERS_NAMES = {
  [SemanticSegmentationReportEntityKey.IMAGE_NAME]: {
    [AccuracyReportType.DATASET_ANNOTATIONS]: 'Image Name',
    [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'Image Name',
  },
  [SemanticSegmentationReportEntityKey.AVERAGE_RESULT]: {
    [AccuracyReportType.DATASET_ANNOTATIONS]: 'Model Average Result',
    [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'Optimized Model Average Result',
  },
  [SemanticSegmentationReportEntityKey.CLASS_ID]: {
    [AccuracyReportType.DATASET_ANNOTATIONS]: 'Class Predicted by Model',
    [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'Class Predicted by Optimized Model',
  },
};

@Component({
  selector: 'wb-semantic-segmentation-accuracy-report-table',
  templateUrl: './semantic-segmentation-accuracy-report-table.component.html',
  styleUrls: ['./semantic-segmentation-accuracy-report-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SemanticSegmentationAccuracyReportTableComponent implements OnInit, OnDestroy {
  tableColumns: DynamicTableColumn[] = null;

  BASIC_DETECTION_COLUMNS: DynamicTableColumn[] = [
    new DynamicTableColumn(SemanticSegmentationReportEntityKey.IMAGE_NAME, null),
    new DynamicTableColumn(SemanticSegmentationReportEntityKey.AVERAGE_RESULT, null, { filter: 'number' }),
  ];

  ADVANCED_DETECTION_COLUMNS: DynamicTableColumn[] = [
    new DynamicTableColumn(SemanticSegmentationReportEntityKey.IMAGE_NAME, null),
    new DynamicTableColumn(SemanticSegmentationReportEntityKey.CLASS_ID, null, { filter: 'number' }),
    new DynamicTableColumn(SemanticSegmentationReportEntityKey.RESULT, null, {
      filter: 'number',
      transform: (value: number) => (isNumber(value) ? value.toString() : 'N/A'),
    }),
  ];

  @Input() projectId: number = null;

  private _report: IAccuracyReport = null;
  @Input() set report(value: IAccuracyReport) {
    this._report = value;
    if (!value) {
      return;
    }

    if (this.dataSource) {
      this.dataSource.id = value.id;
    }

    this._setColumns();
  }

  get report(): IAccuracyReport {
    return this._report;
  }

  @Output() visualize = new EventEmitter<IReportTableVisualizeEvent>();

  dataSource: EntitiesDataSource<
    ISemanticSegmentationReportEntity | IAggregatedSemanticSegmentationReportEntity
  > = null;
  filterableColumns: FilterableColumn[];

  private readonly _unsubscribe$ = new Subject();

  mode: 'basic' | 'advanced' = 'basic';

  constructor(private _accuracyRestService: AccuracyRestService, private _cdr: ChangeDetectorRef) {}

  private _setColumns(): void {
    if (!this._report) {
      return;
    }

    const columns = this.mode === 'basic' ? this.BASIC_DETECTION_COLUMNS : this.ADVANCED_DETECTION_COLUMNS;
    const columnsHeaders = this.mode === 'basic' ? BASIC_COLUMN_HEADERS_NAMES : ADVANCED_COLUMN_HEADERS_NAMES;
    for (const column of columns) {
      column.header = columnsHeaders[column.name][this._report.reportType];
    }
    this.tableColumns = columns;
    this.filterableColumns = columns.map(({ filterColumn }) => filterColumn).filter((column) => !!column);

    if (this.mode === 'advanced') {
      return;
    }

    const classIdColumn = new DynamicTableColumn(
      DetectionReportEntityKey.CLASS_ID,
      BASIC_COLUMN_HEADERS_NAMES[DetectionReportEntityKey.CLASS_ID][this._report.reportType],
      { filter: 'number' }
    ).filterColumn;

    this.filterableColumns.push(classIdColumn);
  }

  ngOnInit(): void {
    this.setMode('basic');
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  getDatasource(): EntitiesDataSource<ISemanticSegmentationReportEntity | IAggregatedSemanticSegmentationReportEntity> {
    const getDetectedReportEntities =
      this.mode === 'basic' ? this.getAggregatedReportEntities.bind(this) : this.getReportEntities.bind(this);

    const dataSource = new EntitiesDataSource<
      ISemanticSegmentationReportEntity | IAggregatedSemanticSegmentationReportEntity
    >(getDetectedReportEntities);

    dataSource.loading$.pipe(takeUntil(this._unsubscribe$)).subscribe(() => this._cdr.detectChanges());

    dataSource.id = this._report?.id;

    return dataSource;
  }

  getReportEntities(reportId: number, params: HttpParams): Observable<IPage<ISemanticSegmentationReportEntity>> {
    return this._accuracyRestService.getPagedReportEntities$<ISemanticSegmentationReportEntity>(
      this.projectId,
      reportId,
      params
    );
  }

  getAggregatedReportEntities(
    reportId: number,
    params: HttpParams
  ): Observable<IPage<IAggregatedSemanticSegmentationReportEntity>> {
    params = new HttpParams({ fromString: params.toString() }).set('aggregate', 'true');
    return this._accuracyRestService.getPagedReportEntities$<IAggregatedSemanticSegmentationReportEntity>(
      this.projectId,
      reportId,
      params
    );
  }

  async onVisualize({ image_name }: ISemanticSegmentationReportEntity): Promise<void> {
    const params = new HttpParams().set('image_name', `eq ${image_name}`);
    const entities = await this._accuracyRestService
      .getReportEntities$<ISemanticSegmentationReportEntity>(this.projectId, this._report.id, params)
      .toPromise();

    const testImage: ITestImage = {
      id: null,
      predictions: [],
      refPredictions: [],
    };
    for (const { predictions, annotations, class_id } of entities) {
      if (predictions.length) {
        testImage.predictions.push({ category_id: class_id, segmentation: predictions });
      }

      if (annotations.length) {
        testImage.refPredictions.push({ category_id: class_id, segmentation: annotations });
      }
    }

    this.visualize.emit({
      imageName: image_name,
      datasetId: this.report.targetDatasetId,
      testImage,
    });
  }

  setMode(mode: 'basic' | 'advanced'): void {
    this.mode = mode;
    this._setColumns();
    this.dataSource?.disconnect();
    this.dataSource = this.getDatasource();
  }
}
