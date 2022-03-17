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

import { AccuracyRestService, IPage } from '@core/services/api/rest/accuracy.service';

import { ITestImage } from '@store/inference-test-image-store/inference-test-image-models';

import {
  AccuracyReportType,
  IAccuracyReport,
  IAggregatedInstanceSegmentationReportEntity,
  IInstanceSegmentationReportEntity,
  InstanceSegmentationReportEntityKey,
} from '@shared/models/accuracy-analysis/accuracy-report';
import { FilterableColumn } from '@shared/components/table-filter-form/filter-form.model';

import { DynamicTableColumn } from '../dynamic-table/dynamic-table.model';
import { IReportTableVisualizeEvent } from '../../../dashboard/components/analyze-accuracy-ribbon-content/analyze-accuracy-ribbon-content.component';
import { EntitiesDataSource } from '../dynamic-table/entities-data-source';

const ADVANCED_COLUMN_HEADERS_NAMES = {
  [InstanceSegmentationReportEntityKey.IMAGE_NAME]: {
    [AccuracyReportType.DATASET_ANNOTATIONS]: 'Image Name',
    [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'Image Name',
  },
  [InstanceSegmentationReportEntityKey.CLASS_ID]: {
    [AccuracyReportType.DATASET_ANNOTATIONS]: 'Class Predicted by Model',
    [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'Class Predicted by Optimized Model',
  },
  [InstanceSegmentationReportEntityKey.PREDICTIONS_COUNT]: {
    [AccuracyReportType.DATASET_ANNOTATIONS]: 'A. Model Detections of Predicted Class',
    [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'A. Optimized Model Detections of Predicted Class',
  },
  [InstanceSegmentationReportEntityKey.ANNOTATIONS_COUNT]: {
    [AccuracyReportType.DATASET_ANNOTATIONS]: 'B. Objects of Predicted Class in Dataset Annotations',
    [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'B. Parent Model Detections of Predicted Class',
  },
  [InstanceSegmentationReportEntityKey.MATCHES]: {
    [AccuracyReportType.DATASET_ANNOTATIONS]: 'Matches \nbetween \nA and B',
    [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'Matches \nbetween \nA and B',
  },
  [InstanceSegmentationReportEntityKey.AP_PRECISION]: {
    [AccuracyReportType.DATASET_ANNOTATIONS]: 'Predicted Class Average Precision',
    [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'Predicted Class Average Precision',
  },
};

const BASIC_COLUMN_HEADERS_NAMES = {
  [InstanceSegmentationReportEntityKey.IMAGE_NAME]: {
    [AccuracyReportType.DATASET_ANNOTATIONS]: 'Image Name',
    [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'Image Name',
  },
  [InstanceSegmentationReportEntityKey.CLASS_ID]: {
    [AccuracyReportType.DATASET_ANNOTATIONS]: 'Class Predicted by Model',
    [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'Class Predicted by Optimized Model',
  },
  [InstanceSegmentationReportEntityKey.PREDICTIONS_COUNT]: {
    [AccuracyReportType.DATASET_ANNOTATIONS]: 'A. Model Detections',
    [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'A. Optimized Model Detections',
  },
  [InstanceSegmentationReportEntityKey.ANNOTATIONS_COUNT]: {
    [AccuracyReportType.DATASET_ANNOTATIONS]: 'B. Objects in Dataset Annotations',
    [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'B. Parent Model Detections',
  },
  [InstanceSegmentationReportEntityKey.MATCHES]: {
    [AccuracyReportType.DATASET_ANNOTATIONS]: 'Matches between A and B',
    [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'Matches between A and B',
  },
};

@Component({
  selector: 'wb-instance-segmentation-accuracy-report-table',
  templateUrl: './instance-segmentation-accuracy-report-table.component.html',
  styleUrls: ['./instance-segmentation-accuracy-report-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceSegmentationAccuracyReportTableComponent implements OnInit, OnDestroy {
  tableColumns: DynamicTableColumn[] = null;

  BASIC_DETECTION_COLUMNS: DynamicTableColumn[] = [
    new DynamicTableColumn(InstanceSegmentationReportEntityKey.IMAGE_NAME, null),
    new DynamicTableColumn(InstanceSegmentationReportEntityKey.PREDICTIONS_COUNT, null, { filter: 'number' }),
    new DynamicTableColumn(InstanceSegmentationReportEntityKey.ANNOTATIONS_COUNT, null, {
      filter: 'number',
    }),
    new DynamicTableColumn(InstanceSegmentationReportEntityKey.MATCHES, null, { filter: 'number' }),
  ];

  ADVANCED_DETECTION_COLUMNS: DynamicTableColumn[] = [
    new DynamicTableColumn(InstanceSegmentationReportEntityKey.IMAGE_NAME, null),
    new DynamicTableColumn(InstanceSegmentationReportEntityKey.CLASS_ID, null, { filter: 'number' }),
    new DynamicTableColumn(InstanceSegmentationReportEntityKey.PREDICTIONS_COUNT, null, { filter: 'number' }),
    new DynamicTableColumn(InstanceSegmentationReportEntityKey.ANNOTATIONS_COUNT, null, {
      filter: 'number',
    }),
    new DynamicTableColumn(InstanceSegmentationReportEntityKey.MATCHES, null, { filter: 'number' }),
    new DynamicTableColumn(InstanceSegmentationReportEntityKey.AP_PRECISION, null, { filter: 'number' }),
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
    IInstanceSegmentationReportEntity | IAggregatedInstanceSegmentationReportEntity
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
      InstanceSegmentationReportEntityKey.CLASS_ID,
      BASIC_COLUMN_HEADERS_NAMES[InstanceSegmentationReportEntityKey.CLASS_ID][this._report.reportType],
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

  getDatasource(): EntitiesDataSource<IInstanceSegmentationReportEntity | IAggregatedInstanceSegmentationReportEntity> {
    const getDetectedReportEntities =
      this.mode === 'basic' ? this.getAggregatedReportEntities.bind(this) : this.getReportEntities.bind(this);

    const dataSource = new EntitiesDataSource<
      IInstanceSegmentationReportEntity | IAggregatedInstanceSegmentationReportEntity
    >(getDetectedReportEntities);

    dataSource.loading$.pipe(takeUntil(this._unsubscribe$)).subscribe(() => this._cdr.detectChanges());

    dataSource.id = this._report?.id;

    return dataSource;
  }

  getReportEntities(reportId: number, params: HttpParams): Observable<IPage<IInstanceSegmentationReportEntity>> {
    // as long as we have rows for detected classes only, e.g. table headers named with respect to detected class
    // enable filter by detected entities
    params = new HttpParams({ fromString: params.toString() }).append('predictions_count', 'gt 0');
    return this._accuracyRestService.getPagedReportEntities$<IInstanceSegmentationReportEntity>(
      this.projectId,
      reportId,
      params
    );
  }

  getAggregatedReportEntities(
    reportId: number,
    params: HttpParams
  ): Observable<IPage<IAggregatedInstanceSegmentationReportEntity>> {
    params = new HttpParams({ fromString: params.toString() }).set('aggregate', 'true');
    return this._accuracyRestService.getPagedReportEntities$<IAggregatedInstanceSegmentationReportEntity>(
      this.projectId,
      reportId,
      params
    );
  }

  async onVisualize({ image_name }: IInstanceSegmentationReportEntity): Promise<void> {
    const params = new HttpParams().set('image_name', `eq ${image_name}`);
    const entities = await this._accuracyRestService
      .getReportEntities$<IInstanceSegmentationReportEntity>(this.projectId, this._report.id, params)
      .toPromise();

    const testImage: ITestImage = {
      id: null,
      predictions: [],
      refPredictions: [],
    };
    for (const { predictions, annotations, class_id } of entities) {
      testImage.predictions.push(
        ...predictions.map(({ segmentation, score }) => ({
          category_id: class_id,
          score,
          segmentation,
        }))
      );
      testImage.refPredictions.push(
        ...annotations.map(({ segmentation }) => ({
          category_id: class_id,
          segmentation,
        }))
      );
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
