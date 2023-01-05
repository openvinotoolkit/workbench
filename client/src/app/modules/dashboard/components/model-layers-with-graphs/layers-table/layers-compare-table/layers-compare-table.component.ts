import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
  ViewContainerRef,
} from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';

import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { isNil, isFinite, isEmpty } from 'lodash';

import { TableFilterFormComponent } from '@shared/components/table-filter-form/table-filter-form.component';
import {
  AppliedFilter,
  FilterableColumn,
  FilterableColumnOptions,
  IMatTableDataSource,
  ValueConditionOption,
} from '@shared/components/table-filter-form/filter-form.model';

import { LayersTableService } from '../layers-table.service';
import { ColumnLabels, ColumnNames, ExecutedLayerItem } from '../layers-table.model';

@Component({
  selector: 'wb-layers-compare-table',
  templateUrl: './layers-compare-table.component.html',
  styleUrls: ['../layers-single-table/layers-single-table.component.scss', './layers-compare-table.component.scss'],
})
export class LayersCompareTableComponent implements AfterViewInit, OnChanges {
  @Input()
  public executionConfigurations: string[] = [];

  @Input()
  public layers: ExecutedLayerItem[];

  public layersDataSource: IMatTableDataSource<ExecutedLayerItem>;

  public sortedColumn: Sort;

  public tableColumns: string[] = [
    ColumnNames.LAYER_NAME,
    ColumnNames.LAYER_TYPE,
    ColumnNames.EXEC_TIME,
    ColumnNames.PRECISION,
    ColumnNames.EXEC_TIME_B,
    ColumnNames.PRECISION_B,
    ColumnNames.DELTA,
    ColumnNames.RATIO,
  ];

  public groupedHeaderRowColumns: string[] = [
    ColumnNames.LAYER_NAME,
    ColumnNames.LAYER_TYPE,
    ColumnNames.CONFIGURATION_A,
    ColumnNames.CONFIGURATION_B,
    ColumnNames.DELTA,
    ColumnNames.RATIO,
  ];

  public ColumnNames = ColumnNames;

  public filterableColumns: FilterableColumn[] = [
    {
      name: ColumnNames.LAYER_NAME,
      label: ColumnLabels.LAYER_NAME,
      type: 'set',
    },
    {
      name: ColumnNames.LAYER_TYPE,
      label: ColumnLabels.LAYER_TYPE,
      type: 'set',
    },
    {
      name: ColumnNames.EXEC_TIME,
      label: `${ColumnLabels.EXEC_TIME} (A)`,
      type: 'time',
    },
    {
      name: ColumnNames.PRECISION,
      label: `${ColumnLabels.PRECISION} (A)`,
      type: 'set',
    },
    {
      name: ColumnNames.EXEC_TIME_B,
      label: ColumnLabels.EXEC_TIME_B,
      type: 'time',
    },
    {
      name: ColumnNames.PRECISION_B,
      label: ColumnLabels.PRECISION_B,
      type: 'set',
    },
    {
      name: ColumnNames.DELTA,
      label: ColumnLabels.DELTA,
      type: 'number',
    },
    {
      name: ColumnNames.RATIO,
      label: ColumnLabels.RATIO,
      type: 'number',
    },
  ];

  public collapsedTableColumns: string[] = [ColumnNames.LAYER, ColumnNames.DELTA, ColumnNames.RATIO];

  public openedLayer: ExecutedLayerItem = null;
  public openedLayerIndex: number = null;

  public openedDetailsTab = 0;

  @ViewChildren('layerRow', { read: ViewContainerRef })
  public layerRows: QueryList<ViewContainerRef>;

  @ViewChild(MatSort)
  public sort: MatSort;

  @ViewChild(TableFilterFormComponent, { static: true })
  private _filterComponent: TableFilterFormComponent;

  isNil = isNil;
  isFinite = isFinite;

  constructor(public layersTableService: LayersTableService) {}

  ngAfterViewInit(): void {
    this.setUpDataSourceSortAndFilter();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { layers } = changes;
    if (!layers || isEmpty(layers.currentValue)) {
      return;
    }
    this.layersTableService.setUpFilterableColumnOptions(this.layers);
    this.layersDataSource = new MatTableDataSource(this.layers);
    this.setUpDataSourceSortAndFilter();
    this._filterComponent.reset();
  }

  get notAvailableLabel(): string {
    return this.layersTableService.notAvailableLabel;
  }

  get layerRowsChanges$(): Observable<QueryList<ViewContainerRef>> {
    return this.layerRows.changes;
  }

  get filterableColumnOptions(): FilterableColumnOptions {
    return this.layersTableService.filterableColumnOptions;
  }

  get valueConditionOptions(): ValueConditionOption[] {
    return this.layersTableService.valueConditionOptions;
  }

  get placeholderHeaderRowColumns(): string[] {
    return this.tableColumns.map((column: string) =>
      this.groupedHeaderRowColumns.includes(column) ? this.layersTableService.placeholderTableColumn : column
    );
  }

  scrollToRowAndBackOnClose(index: number): void {
    this.openedLayerIndex = index;
    this.layerRowsChanges$
      .pipe(
        filter(() => !!this.openedLayerIndex),
        take(3), // For two open and one close layers details events, then unsubscribe
        map((queryList) => queryList.toArray())
      )
      .subscribe(
        (viewContainerRefList: ViewContainerRef[]) => {
          viewContainerRefList[this.openedLayerIndex].element.nativeElement.scrollIntoView({ block: 'center' });
        },
        () => {},
        () => {
          this.openedLayerIndex = null;
        }
      );
  }

  updateOpenedDetailsTab() {
    if (this.openedLayer && !this.openedLayer.details[this.openedDetailsTab]) {
      this.openedDetailsTab = this.openedDetailsTab ? 0 : 1;
    }
  }

  resetFilter() {
    this.layersDataSource.filter = null;
  }

  applyFilter(appliedFilter: AppliedFilter) {
    this.layersDataSource.filter = appliedFilter;
  }

  getDeviceName(executionConfiguration: string): string {
    return executionConfiguration ? executionConfiguration.split('\n')[0].split(' • ')[3] : '';
  }

  private setUpDataSourceSortAndFilter(): void {
    this.layersDataSource.sort = this.sort;
    this.layersDataSource.sortingDataAccessor = LayersTableService.tableDataAccessor;
    this.layersDataSource.filterPredicate = this.layersTableService.customFilterPredicate;
  }
}
