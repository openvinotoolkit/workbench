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

import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AccuracyRestService } from '@core/services/api/rest/accuracy.service';
import { MessagesService } from '@core/services/common/messages.service';

import {
  IAccuracyTensorDistanceReport,
  ITensorDistanceReportEntity,
  TensorDistanceReportEntityKey,
} from '@shared/models/accuracy-analysis/accuracy-report';
import { toLowerBoundedString } from '@shared/pipes/format-number.pipe';
import { FilterableColumn } from '@shared/components/table-filter-form/filter-form.model';

import { DynamicTableColumn } from '../dynamic-table/dynamic-table.model';
import { EntitiesDataSource } from '../dynamic-table/entities-data-source';
import { IPerTensorReportTableVisualizeEvent } from '../../../dashboard/components/analyze-accuracy-ribbon-content/analyze-accuracy-ribbon-content.component';

// transform reused in visualization component
export const MSE_DYNAMIC_TABLE_COLUMN = new DynamicTableColumn(
  TensorDistanceReportEntityKey.MSE,
  'Mean Squared Error',
  {
    filter: 'number',
    transform: (value: number) => toLowerBoundedString(value, 10),
  }
);

@Component({
  selector: 'wb-per-tensor-accuracy-report-table',
  templateUrl: './per-tensor-accuracy-report-table.component.html',
  styleUrls: ['./per-tensor-accuracy-report-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerTensorAccuracyReportTableComponent implements OnInit, OnDestroy {
  @Input() projectId: number = null;

  private _report: IAccuracyTensorDistanceReport = null;
  @Input() set report(value: IAccuracyTensorDistanceReport) {
    this._report = value;
    if (!value) {
      return;
    }

    if (this.dataSource) {
      this.dataSource.id = value.id;
    }
  }

  get report(): IAccuracyTensorDistanceReport {
    return this._report;
  }

  @Output() visualize = new EventEmitter<IPerTensorReportTableVisualizeEvent>();

  columns: DynamicTableColumn[] = [
    new DynamicTableColumn(TensorDistanceReportEntityKey.IMAGE_NAME, 'Image Name'),
    new DynamicTableColumn(TensorDistanceReportEntityKey.OUTPUT_NAME, 'Output name'),
    MSE_DYNAMIC_TABLE_COLUMN,
  ];

  readonly filterableColumns: FilterableColumn[] = this.columns
    .map(({ filterColumn }) => filterColumn)
    .filter((column) => !!column);

  dataSource: EntitiesDataSource<ITensorDistanceReportEntity> = null;

  readonly outputLayerControl = new UntypedFormControl(null);

  readonly selectOutputTooltipMessage = this._messagesService.tooltipMessages.accuracyAnalysis.selectOutputToDisplay;

  private readonly _unsubscribe$ = new Subject();

  constructor(
    private _accuracyRestService: AccuracyRestService,
    private _cdr: ChangeDetectorRef,
    private _messagesService: MessagesService
  ) {}

  ngOnInit(): void {
    this.dataSource = new EntitiesDataSource<ITensorDistanceReportEntity>((reportId, params) =>
      this._accuracyRestService.getPagedReportEntities$(this.projectId, reportId, params)
    );

    this.dataSource.loading$.pipe(takeUntil(this._unsubscribe$)).subscribe(() => this._cdr.detectChanges());

    this.dataSource.id = this._report?.id;

    this.outputLayerControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((value) => {
      this.dataSource.httpParams = value
        ? new HttpParams().set(TensorDistanceReportEntityKey.OUTPUT_NAME, `eq ${value}`)
        : null;
    });

    const [firstOutputName, ...otherOutputNames] = this.report?.outputNames;
    this.outputLayerControl.setValue(firstOutputName);

    if (!otherOutputNames.length) {
      this.outputLayerControl.disable();
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  async onVisualize({ image_name, report_id }: ITensorDistanceReportEntity): Promise<void> {
    const reportEntities = await this._accuracyRestService
      .getPagedReportEntities$(
        this.projectId,
        report_id,
        new HttpParams().set(TensorDistanceReportEntityKey.IMAGE_NAME, `eq ${image_name}`)
      )
      .toPromise();
    const outputsMSEInfo = reportEntities.entities.map(({ output_name, mse }) => ({ output_name, mse }));
    this.visualize.emit({ imageName: image_name, outputsMSEInfo });
  }
}
