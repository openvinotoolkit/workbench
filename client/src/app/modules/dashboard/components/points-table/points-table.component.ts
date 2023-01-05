import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';

import { IInferenceResult } from '@store/inference-history-store/inference-history.model';
import { THROUGHPUT_UNIT } from '@store/model-store/model.model';

@Component({
  selector: 'wb-points-table',
  templateUrl: './points-table.component.html',
  styleUrls: ['./points-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PointsTableComponent implements AfterViewInit {
  generatedColumns = ['nireq', 'batch', 'throughput', 'latency'];
  displayedColumns = ['select', 'id', ...this.generatedColumns];
  columnNamesTextMap = {
    id: '#',
    nireq: 'Stream',
    batch: 'Batch',
    throughput: 'Throughput',
    latency: 'Latency, ms',
    select: 'Select',
  };

  @Input() set points(value: IInferenceResult[]) {
    this.dataSource.data = value;
  }

  @Input() set throughputUnit(value: THROUGHPUT_UNIT) {
    this.columnNamesTextMap.throughput = `Throughput, ${value}`;
  }

  @Input() disabled = false;

  readonly dataSource = new MatTableDataSource<IInferenceResult>([]);

  @Input() public selectedPoint: IInferenceResult;

  @Output() public selectPoint = new EventEmitter<IInferenceResult>();

  @ViewChild(MatSort) private _sort: MatSort;

  public sortedColumn: Sort = { active: 'throughput', direction: 'desc' };

  ngAfterViewInit(): void {
    this.dataSource.sort = this._sort;
  }

  selectRow(result: IInferenceResult) {
    this.selectPoint.emit(result);
  }
}
