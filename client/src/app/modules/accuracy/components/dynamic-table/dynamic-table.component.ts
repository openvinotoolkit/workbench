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
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';

import { MessagesService } from '@core/services/common/messages.service';

import {
  FilterableColumn,
  numberValueConditionsMap,
  ValueConditionOption,
} from '@shared/components/table-filter-form/filter-form.model';
import { TableFilterFormComponent } from '@shared/components/table-filter-form/table-filter-form.component';

import { DynamicTableColumn } from './dynamic-table.model';
import { EntitiesDataSource } from './entities-data-source';

// TODO Consider moving to shared components
@Component({
  selector: 'wb-dynamic-table',
  templateUrl: './dynamic-table.component.html',
  styleUrls: ['./dynamic-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicTableComponent<T = object> implements AfterViewInit {
  private _columns: DynamicTableColumn[];
  @Input() set columns(value: DynamicTableColumn[]) {
    this._columns = value;
    // TODO set sortable column
    this.currentSort = { active: this.columnNames[0], direction: 'desc' };
  }

  get columns(): DynamicTableColumn[] {
    return this._columns;
  }

  @Input() filterableColumns: FilterableColumn[];

  get columnNames(): string[] {
    const columnNames = this.columns.map(({ name }) => name);
    if (!columnNames?.length) {
      return [];
    }
    return [...columnNames, this.actionsColumnLabels.name];
  }

  private _dataSource: EntitiesDataSource<T> = null;
  @Input() set dataSource(value: EntitiesDataSource<T>) {
    this._dataSource = value;

    if (!this._dataSource) {
      return;
    }

    // reset state
    this.currentSort = { active: this.columnNames[0], direction: 'desc' };
    if (this._paginator) {
      this._paginator.pageIndex = 0;
    }
    this._filter?.reset();

    this._dataSource.sort = this._sort;
    this._dataSource.paginator = this._paginator;
    this._dataSource.filter = this._filter;
  }

  get dataSource(): EntitiesDataSource<T> {
    return this._dataSource;
  }

  @Output() action = new EventEmitter<T>();

  valueConditionOptions: ValueConditionOption[] = Object.values(numberValueConditionsMap);

  currentSort: Sort;

  @ViewChild(MatSort) private _sort: MatSort;
  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  @ViewChild(TableFilterFormComponent) private _filter: TableFilterFormComponent;

  readonly actionsColumnLabels = {
    name: 'actions',
    header: 'Actions',
    buttonText: 'Visualize',
  };

  readonly paginatorPageSizeOptions = [5, 10, 50];

  readonly columnsDescriptionHint = this._messages.hintMessages.analyzeAccuracyReportRibbon.tableColumnsDescription;

  constructor(private _messages: MessagesService) {}

  ngAfterViewInit(): void {
    if (this.dataSource) {
      this.dataSource.sort = this._sort;
      this.dataSource.paginator = this._paginator;
      this.dataSource.filter = this._filter;
    }
  }

  onAction(element: T): void {
    this.action.emit(element);
  }
}
