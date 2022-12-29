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

import { IInferenceConfiguration } from '@shared/models/compound-inference-config';

@Component({
  selector: 'wb-selected-inferences-table',
  templateUrl: './selected-inferences-table.component.html',
  styleUrls: ['./selected-inferences-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectedInferencesTableComponent implements AfterViewInit {
  @Input() set data(value: IInferenceConfiguration[]) {
    this.dataSource.data = value;
  }

  displayedColumns = ['nireq', 'batch', 'actions'];

  dataSource = new MatTableDataSource<IInferenceConfiguration>();

  @Output() remove = new EventEmitter<IInferenceConfiguration>();

  @ViewChild(MatSort) sort: MatSort;

  public sortedColumn: Sort = { active: 'stream', direction: 'desc' };

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  removeItem(element: IInferenceConfiguration) {
    this.remove.emit(element);
  }
}
