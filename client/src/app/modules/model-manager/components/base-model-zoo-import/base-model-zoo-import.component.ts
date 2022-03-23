import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { FormControl } from '@angular/forms';

import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { BaseModelZooDataSource } from '@shared/models/model-zoo-data-source/base-model-zoo-data-source';

import { ModelZooFilterGroupComponent } from '../model-zoo-filter-group/model-zoo-filter-group.component';

@Component({ template: '' })
export abstract class BaseModelZooImportComponent<T, U = string> implements AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) private _paginator: MatPaginator;

  @ViewChild(ModelZooFilterGroupComponent) private _filterGroupComponent: ModelZooFilterGroupComponent;

  abstract readonly dataSource: BaseModelZooDataSource<T, U>;

  readonly sortControl = new FormControl(null);
  readonly filtersControl = new FormControl({});

  modelSearch = '';

  readonly appliedFiltersCount$ = this.filtersControl.valueChanges.pipe(
    map((filters: U) => Object.entries(filters).filter(([, value]) => value.length).length)
  );

  protected _selectedModel: T = null;
  get selectedModel(): T {
    return this._selectedModel;
  }
  set selectedModel(value: T) {
    this._selectedModel = value;
  }

  protected readonly _unsubscribe$ = new Subject<void>();

  protected constructor() {
    this._subscribeToSortAndFiltersChanges();
  }

  protected abstract get _dataSourceFilter(): U;

  abstract importModel(): void;

  searchModels(value: string): void {
    this.modelSearch = value;
    this._filter();
  }

  protected _filter(): void {
    this.dataSource.filter = this._dataSourceFilter;
  }

  protected _subscribeToSortAndFiltersChanges(): void {
    this.sortControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((sort) => {
      this.dataSource.sort = sort;
    });

    this.filtersControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe(() => {
      this._filter();
    });
  }

  resetAllFilters(): void {
    this._filterGroupComponent.resetAllFilters();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this._paginator;
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }
}
