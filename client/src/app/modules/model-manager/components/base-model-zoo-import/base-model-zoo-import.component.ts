import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { FormControl, FormGroup } from '@angular/forms';

import { debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { merge, Subject } from 'rxjs';

import { BaseModelZooDataSource, IModelZooSort } from '@shared/models/model-zoo-data-source/base-model-zoo-data-source';
import { AdvancedConfigField, SelectOption } from '@shared/components/config-form-field/config-form-field.component';

import { ModelZooFilterGroupComponent } from '../model-zoo-filter-group/model-zoo-filter-group.component';

@Component({ template: '' })
export abstract class BaseModelZooImportComponent<T, U = string> implements AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) private _paginator: MatPaginator;

  @ViewChild(ModelZooFilterGroupComponent) private _filterGroupComponent: ModelZooFilterGroupComponent;

  abstract readonly dataSource: BaseModelZooDataSource<T, U>;

  readonly filtersControl = new FormControl({});

  readonly sortField: AdvancedConfigField = {
    type: 'select',
    name: 'sort',
    options: [],
  };

  readonly searchField: AdvancedConfigField = {
    type: 'text',
    name: 'search',
    suffixIcon: 'search',
  };

  readonly sortControl = new FormControl(null);
  readonly searchControl = new FormControl('');
  readonly sortAndSearchFormGroup = new FormGroup({
    [this.sortField.name]: this.sortControl,
    [this.searchField.name]: this.searchControl,
  });

  readonly appliedFiltersCount$ = this.filtersControl.valueChanges.pipe(
    map((filters: U) => Object.entries(filters).filter(([, value]) => value.length).length)
  );

  private _selectedModel: T = null;
  get selectedModel(): T {
    return this._selectedModel;
  }
  set selectedModel(value: T) {
    this._selectedModel = value;
  }

  readonly emptyFilteredModelsTemplateContext = {
    action: () => {
      this.resetSearch();
      this.resetAllFilters();
    },
  };

  protected readonly _unsubscribe$ = new Subject<void>();

  protected constructor() {
    this._subscribeToSortAndFiltersChanges();
  }

  protected abstract get _dataSourceFilter(): U;

  abstract importModel(): void;

  protected _populateSortOptions(): void {
    this.sortField.options = this.dataSource.sortOptions.map((sortOption) => ({
      value: sortOption,
      name: sortOption.label,
    })) as SelectOption[];
    this.sortControl.setValue(this.dataSource.defaultSortOption);
  }

  private _filter(): void {
    this.dataSource.filter = this._dataSourceFilter;
  }

  private _subscribeToSortAndFiltersChanges(): void {
    this.sortControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((sort: IModelZooSort<T>) => {
      this.dataSource.sort = sort;
    });

    const debouncedSearch$ = this.searchControl.valueChanges.pipe(debounceTime(200), distinctUntilChanged());

    merge(debouncedSearch$, this.filtersControl.valueChanges)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(() => {
        this._filter();
      });
  }

  resetAllFilters(): void {
    this._filterGroupComponent.resetAllFilters();
  }

  resetSearch(): void {
    this.searchControl.setValue('');
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this._paginator;
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }
}
