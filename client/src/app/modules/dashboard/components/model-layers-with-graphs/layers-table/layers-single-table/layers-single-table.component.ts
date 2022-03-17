import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  OnChanges,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
  ViewContainerRef,
  EventEmitter,
} from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Observable } from 'rxjs';

import { isEmpty, isNil, toNumber } from 'lodash';

import { Categories, GAActions, GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

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
  selector: 'wb-layers-single-table',
  templateUrl: './layers-single-table.component.html',
  styleUrls: ['./layers-single-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayersSingleTableComponent implements OnChanges, AfterViewInit {
  @Output() changeSelectedLayerName: EventEmitter<string> = new EventEmitter<string>();
  @Input() public layers: ExecutedLayerItem[];
  @Input() public selectedLayerName: string;
  @Input() public isGraphsBlockExpanded = false;

  public layersDataSource: IMatTableDataSource<ExecutedLayerItem>;

  public tableColumns: string[] = [ColumnNames.LAYER_NAME, ColumnNames.EXEC_TIME, ColumnNames.LAYER_INFORMATION];
  public collapsedTableColumns: string[] = [ColumnNames.LAYER_INFORMATION];

  public ColumnNames = ColumnNames;
  public ColumnLabels = ColumnLabels;

  public filterableColumns: FilterableColumn[] = [
    {
      name: ColumnNames.EXEC_ORDER,
      label: ColumnLabels.EXEC_ORDER,
      type: 'number',
    },
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
      label: ColumnLabels.EXEC_TIME,
      type: 'time',
    },
    {
      name: ColumnNames.PRECISION,
      label: ColumnLabels.PRECISION,
      type: 'set',
    },
  ];

  public sortedColumn: Sort;

  public selectedLayer: ExecutedLayerItem = null;
  public selectedLayerIndex: number = null;

  public readonly layerNameColumnClassName = 'layer-name-cell';
  public readonly layersTableId = 'layers-table';
  public readonly layerTableParent = 'mat-sidenav-content';

  @ViewChildren('layerRow', { read: ViewContainerRef })
  public layerRows: QueryList<ViewContainerRef>;

  @ViewChild(MatSort)
  public sort: MatSort;

  @ViewChild(TableFilterFormComponent, { static: true })
  private _filterComponent: TableFilterFormComponent;

  isFinite = isFinite;
  toNumber = toNumber;

  constructor(public layersTableService: LayersTableService, private googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnChanges(changes: SimpleChanges): void {
    const { layers, selectedLayerName } = changes;
    if (selectedLayerName && !selectedLayerName.isFirstChange()) {
      const layerName = this.selectedLayer ? this.selectedLayer.layerName : null;
      if (selectedLayerName.currentValue !== layerName) {
        this.selectedLayer = this.getLayerByName(selectedLayerName.currentValue);
        this.selectedLayerIndex = this.getSelectedLayerIndex(selectedLayerName.currentValue);
        this.scrollToSelectedLayer(this.selectedLayerIndex);
      }
    }

    if (!layers || isEmpty(layers.currentValue)) {
      return;
    }
    this.layersTableService.setUpFilterableColumnOptions(this.layers);
    this.layersTableService.setUpPrecisionFilterableColumnOptions(this.layers, []);
    this.layersDataSource = new MatTableDataSource(this.layers) as IMatTableDataSource<ExecutedLayerItem>;
    this.setUpDataSourceSortAndFilter();
    this._filterComponent.reset();
  }

  ngAfterViewInit(): void {
    this.setUpDataSourceSortAndFilter();
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

  resetFilter() {
    this.layersDataSource.filter = null;
  }

  applyFilter(appliedFilter: AppliedFilter) {
    this.layersDataSource.filter = appliedFilter;
    this.googleAnalyticsService.emitEvent(GAActions.FILTER, Categories.PER_LAYER_TABLE, { appliedFilter });
  }

  clickLayer(row: ExecutedLayerItem, index: number) {
    this.selectedLayer = row;
    this.selectedLayerIndex = index;
    this.scrollToSelectedLayer(index);
    this.changeSelectedLayerName.emit(row.layerName);
    this.googleAnalyticsService.emitEvent(GAActions.SELECT_LAYER, Categories.PER_LAYER_TABLE);
  }

  private setUpDataSourceSortAndFilter(): void {
    this.layersDataSource.sort = this.sort;
    this.layersDataSource.sortingDataAccessor = LayersTableService.tableDataAccessor;
    this.layersDataSource.filterPredicate = this.layersTableService.customFilterPredicate;
  }

  private getLayerByName(layerName: string): ExecutedLayerItem | null {
    return this.layers.find((layer) => layer.layerName === layerName);
  }

  private getSelectedLayerIndex(layerName: string): number | null {
    if (!layerName) {
      return null;
    }
    const layersTable = document.getElementById(this.layersTableId);
    const rowsInTable = Array.from(layersTable.querySelectorAll(`.${this.layerNameColumnClassName}`));
    const currentRow = rowsInTable.find((row) => (row as HTMLElement).innerText === layerName);
    const indexOfSelectedLayer = rowsInTable.indexOf(currentRow);

    return indexOfSelectedLayer === -1 ? null : indexOfSelectedLayer;
  }

  private scrollToSelectedLayer(layerIndex: number): void {
    if (isNil(layerIndex)) {
      return;
    }
    const layersTable = document.getElementById(this.layersTableId);
    const layersTableParent = layersTable.closest(this.layerTableParent);
    const rowsInTable = Array.from(layersTable.querySelectorAll('tr'));
    const selectedLayerTopOffset = rowsInTable[layerIndex].offsetTop;
    layersTableParent.scrollTo({
      top: selectedLayerTopOffset,
      behavior: 'smooth',
    });
  }
}
