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
import { UntypedFormControl } from '@angular/forms';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AccuracyRestService } from '@core/services/api/rest/accuracy.service';

import { ITestImage } from '@store/inference-test-image-store/inference-test-image-models';

import {
  AccuracyReportTableColumnHeaders,
  AccuracyReportType,
  ClassificationReportEntityKey,
  IAccuracyReport,
  IClassificationReportEntity,
} from '@shared/models/accuracy-analysis/accuracy-report';
import { FilterableColumn } from '@shared/components/table-filter-form/filter-form.model';

import { EntitiesDataSource } from '../dynamic-table/entities-data-source';
import { DynamicTableColumn } from '../dynamic-table/dynamic-table.model';
import { IReportTableVisualizeEvent } from '../../../dashboard/components/analyze-accuracy-ribbon-content/analyze-accuracy-ribbon-content.component';

@Component({
  selector: 'wb-classification-accuracy-report-table',
  templateUrl: './classification-accuracy-report-table.component.html',
  styleUrls: ['./classification-accuracy-report-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationAccuracyReportTableComponent implements OnInit, OnDestroy {
  readonly classificationReportTableColumns: DynamicTableColumn[] = [
    new DynamicTableColumn(ClassificationReportEntityKey.IMAGE_NAME, null),
    new DynamicTableColumn(ClassificationReportEntityKey.TOP_1_PREDICTION, null, { filter: 'number' }),
    new DynamicTableColumn(ClassificationReportEntityKey.ANNOTATION_CLASS_ID, null, { filter: 'number' }),
    new DynamicTableColumn(ClassificationReportEntityKey.ANNOTATION_ID_RANK_IN_PREDICTIONS, null, {
      filter: 'number',
    }),
    new DynamicTableColumn(ClassificationReportEntityKey.TOP_1_PREDICTION_CONFIDENCE, null, { filter: 'number' }),
    new DynamicTableColumn(ClassificationReportEntityKey.CONFIDENCE_IN_ANNOTATION_CLASS_ID, null, {
      filter: 'number',
    }),
  ];

  private readonly _classificationReportTableColumnsHeaders: AccuracyReportTableColumnHeaders<ClassificationReportEntityKey> =
    {
      [ClassificationReportEntityKey.IMAGE_NAME]: {
        [AccuracyReportType.DATASET_ANNOTATIONS]: 'Image Name',
        [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'Image Name',
      },
      [ClassificationReportEntityKey.TOP_1_PREDICTION]: {
        [AccuracyReportType.DATASET_ANNOTATIONS]: 'Predicted Class',
        [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'Class Predicted by Optimized Model',
      },
      [ClassificationReportEntityKey.ANNOTATION_CLASS_ID]: {
        [AccuracyReportType.DATASET_ANNOTATIONS]: 'Class Defined in Dataset Annotations',
        [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'Class Predicted by Parent Model',
      },
      [ClassificationReportEntityKey.ANNOTATION_ID_RANK_IN_PREDICTIONS]: {
        [AccuracyReportType.DATASET_ANNOTATIONS]: 'Rank of Class Defined in Dataset Annotations in Model Predictions',
        [AccuracyReportType.PARENT_MODEL_PREDICTIONS]:
          'Rank of Class Predicted by Parent Model in Optimized Model Predictions',
      },
      [ClassificationReportEntityKey.TOP_1_PREDICTION_CONFIDENCE]: {
        [AccuracyReportType.DATASET_ANNOTATIONS]: 'Model Confidence in Predicted Class',
        [AccuracyReportType.PARENT_MODEL_PREDICTIONS]:
          'Optimized Model Confidence in Class Predicted by Optimized Model',
      },
      [ClassificationReportEntityKey.CONFIDENCE_IN_ANNOTATION_CLASS_ID]: {
        [AccuracyReportType.DATASET_ANNOTATIONS]: 'Model Confidence in Class Defined in Dataset Annotations',
        [AccuracyReportType.PARENT_MODEL_PREDICTIONS]: 'Optimized Model Confidence in Class Predicted by Parent Model',
      },
    };

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

    this._setTableColumnsHeaders();
  }

  get report(): IAccuracyReport {
    return this._report;
  }

  @Output() visualize = new EventEmitter<IReportTableVisualizeEvent>();

  dataSource: EntitiesDataSource<IClassificationReportEntity> = null;

  filterableColumns: FilterableColumn[];

  readonly onlyErroneousFormControl = new UntypedFormControl(false);

  private _unsubscribe$ = new Subject();

  constructor(private _accuracyRestService: AccuracyRestService, private _cdr: ChangeDetectorRef) {}

  private _setTableColumnsHeaders(): void {
    for (const column of this.classificationReportTableColumns) {
      const reportTypeColumnHeaders = this._classificationReportTableColumnsHeaders[column.name];
      if (reportTypeColumnHeaders) {
        column.header = reportTypeColumnHeaders[this._report.reportType];
      }
    }

    this.filterableColumns = this.classificationReportTableColumns
      .map(({ filterColumn }) => filterColumn)
      .filter((column) => !!column);
  }

  ngOnInit(): void {
    this.dataSource = new EntitiesDataSource<IClassificationReportEntity>((reportId, params) =>
      this._accuracyRestService.getPagedReportEntities$<IClassificationReportEntity>(this.projectId, reportId, params)
    );

    this.dataSource.loading$.pipe(takeUntil(this._unsubscribe$)).subscribe(() => this._cdr.detectChanges());
    this.dataSource.id = this._report?.id;

    this.onlyErroneousFormControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((value) => {
      this.dataSource.httpParams = value ? new HttpParams().set('with_error', 'true') : null;
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  async onVisualize({ image_name }: IClassificationReportEntity): Promise<void> {
    const params = new HttpParams().set('image_name', `eq ${image_name}`);
    const entities = await this._accuracyRestService
      .getReportEntities$<IClassificationReportEntity>(this.projectId, this._report.id, params)
      .toPromise();

    const testImage: ITestImage = {
      id: null,
      predictions: [],
      refPredictions: [],
    };
    for (const { top_k_predictions, annotation_class_id } of entities) {
      testImage.predictions.push(...top_k_predictions.map(({ category_id, score }) => ({ category_id, score })));
      testImage.refPredictions.push({ category_id: annotation_class_id });
    }

    this.visualize.emit({
      imageName: image_name,
      datasetId: this.report.targetDatasetId,
      testImage,
    });
  }
}
