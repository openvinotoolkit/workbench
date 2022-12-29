import { AfterViewInit, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';

import { isEmpty } from 'lodash';

import { ModelItem, TaskTypeToNameMap } from '@store/model-store/model.model';

import { formatSize } from '@shared/pipes/format-number.pipe';

@Component({
  selector: 'wb-available-models-table',
  templateUrl: './available-models-table.component.html',
  styleUrls: ['./available-models-table.component.scss'],
})
export class AvailableModelsTableComponent implements AfterViewInit {
  @Input() set models(value: ModelItem[]) {
    this.dataSource.data = value;
  }

  @Input() isLoading: boolean;

  @Output() openModel = new EventEmitter<ModelItem>();

  @ViewChild(MatSort) private _sort: MatSort;

  dataSource: MatTableDataSource<ModelItem> = new MatTableDataSource<ModelItem>([]);

  readonly TaskTypeToNameMap = TaskTypeToNameMap;

  readonly formatSize = formatSize;

  readonly tableColumns: string[] = ['name', 'bodyPrecisions', 'usage', 'size', 'date', 'modelOpen'];

  sortedColumn: Sort = { active: 'date', direction: 'desc' };

  ngAfterViewInit(): void {
    this.dataSource.sort = this._sort;
  }

  get haveModels(): boolean {
    return isEmpty(this.dataSource.data);
  }
}
