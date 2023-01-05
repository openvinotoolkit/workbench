import { DataSource } from '@angular/cdk/collections';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { SortDirection } from '@angular/material/sort';

import { BehaviorSubject, combineLatest, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

export interface IModelZooSort<T> {
  field: keyof T;
  direction: SortDirection;
  label: string;
}

export abstract class BaseModelZooDataSource<T, U = string> implements DataSource<T> {
  private readonly _filter$ = new BehaviorSubject<U>(null);
  private readonly _sort$ = new BehaviorSubject<IModelZooSort<T>>(null);
  private _paginator: MatPaginator;
  private readonly _internalPageChanges$ = new Subject<void>();

  protected readonly _data$ = new BehaviorSubject<T[]>([] as T[]);
  private readonly _renderData$ = new BehaviorSubject<T[]>([] as T[]);

  abstract readonly sortOptions: IModelZooSort<T>[];

  get defaultSortOption(): IModelZooSort<T> {
    return this.sortOptions[0];
  }

  filteredData: T[] = [];

  private _renderChangesSubscription: Subscription;

  set data(data: T[]) {
    data = Array.isArray(data) ? data : [];
    this._data$.next(data);
    // Normally the `filteredData` is updated by the re-render
    // subscription, but that won't happen if it's inactive.
    if (!this._renderChangesSubscription) {
      this._filterData(data, this.filter);
    }
  }

  get data(): T[] {
    return this._data$.value;
  }

  set filter(filter: U) {
    this._filter$.next(filter);
    // Normally the `filteredData` is updated by the re-render
    // subscription, but that won't happen if it's inactive.
    if (!this._renderChangesSubscription) {
      this._filterData(this.data, this._filter$.value);
    }
  }

  get filter(): U {
    return this._filter$.value;
  }

  set sort(sort: IModelZooSort<T>) {
    this._sort$.next(sort);
  }

  get sort(): IModelZooSort<T> {
    return this._sort$.value;
  }

  set paginator(value: MatPaginator) {
    this._paginator = value;
    this._updateChangesSubscription();
  }

  get paginator(): MatPaginator {
    return this._paginator;
  }

  private _updateChangesSubscription(): void {
    const data$ = this._data$;

    const filteredData$ = combineLatest([data$, this._filter$]).pipe(
      map(([data, filter]) => this._filterData(data, filter))
    );

    const orderedData$ = combineLatest([filteredData$, this._sort$]).pipe(
      map(([data, sort]) => this._sortData(data, sort))
    );

    const pageChange$ = this._paginator
      ? merge(this._paginator.initialized, this._paginator.page, this._internalPageChanges$)
      : of(null);
    const paginatedData$ = combineLatest([orderedData$, pageChange$]).pipe(
      map(([data]) => this._pageData(data, this.paginator))
    );

    this._renderChangesSubscription?.unsubscribe();
    this._renderChangesSubscription = paginatedData$.subscribe((data) => this._renderData$.next(data));
  }

  private _filterData(data: T[], filter: U): T[] {
    this.filteredData = !filter ? data : data.filter((item) => this.filterPredicate(item, filter));

    if (this.paginator) {
      this._updatePaginator(this.filteredData.length);
    }

    return this.filteredData;
  }

  private _updatePaginator(filteredDataLength: number): void {
    Promise.resolve().then(() => {
      const paginator = this.paginator;

      if (!paginator) {
        return;
      }

      paginator.length = filteredDataLength;

      // If the page index is set beyond the page, reduce it to the last page.
      if (paginator.pageIndex > 0) {
        const lastPageIndex = Math.ceil(paginator.length / paginator.pageSize) - 1 || 0;
        const newPageIndex = Math.min(paginator.pageIndex, lastPageIndex);

        if (newPageIndex !== paginator.pageIndex) {
          paginator.pageIndex = newPageIndex;

          // Since the paginator only emits after user-generated changes,
          // we need our own stream so we know to should re-render the data.
          this._internalPageChanges$.next();
        }
      }
    });
  }

  filterPredicate(data: T, filter: U): boolean {
    if (typeof filter !== 'string') {
      throw new Error('Custom filer predicate is not provided');
    }

    // Default filer predicate for string case taken from MatTableDataSource implementation
    // Transform the data into a lowercase string of all property values.
    const dataStr = Object.keys(data)
      .reduce((currentTerm: string, key: string) => {
        // Use an obscure Unicode character to delimit the words in the concatenated string.
        // This avoids matches where the values of two columns combined will match the user's query
        // (e.g. `Flute` and `Stop` will match `Test`). The character is intended to be something
        // that has a very low chance of being typed in by somebody in a text field. This one in
        // particular is "White up-pointing triangle with dot" from
        // https://en.wikipedia.org/wiki/List_of_Unicode_characters
        return currentTerm + data[key] + '◬';
      }, '')
      .toLowerCase();

    // Transform the filter by converting it to lowercase and removing whitespace.
    const transformedFilter = filter.trim().toLowerCase();

    return dataStr.indexOf(transformedFilter) !== -1;
  }

  // reuse mat table data source implementation to handle edge cases
  private _sortData(data: T[], sort: IModelZooSort<T>): T[] {
    if (!sort) {
      return data;
    }
    // TODO Casting to string violates T[keyof T] type check, consider narrowing filtered field type to string | number
    const active = sort.field as string;
    const direction = sort.direction;
    if (!active || direction === '') {
      return data;
    }

    return data.slice().sort((a, b) => {
      let valueA = a[active];
      let valueB = b[active];

      // If there are data in the column that can be converted to a number,
      // it must be ensured that the rest of the data
      // is of the same type so as not to order incorrectly.
      const valueAType = typeof valueA;
      const valueBType = typeof valueB;

      if (valueAType !== valueBType) {
        if (valueAType === 'number') {
          valueA += '';
        }
        if (valueBType === 'number') {
          valueB += '';
        }
      }

      // If both valueA and valueB exist (truthy), then compare the two. Otherwise, check if
      // one value exists while the other doesn't. In this case, existing value should come last.
      // This avoids inconsistent results when comparing values to undefined/null.
      // If neither value exists, return 0 (equal).
      let comparatorResult = 0;
      if (valueA != null && valueB != null) {
        // Check if one value is greater than the other; if equal, comparatorResult should remain 0.
        if (valueA > valueB) {
          comparatorResult = 1;
        } else if (valueA < valueB) {
          comparatorResult = -1;
        }
      } else if (valueA != null) {
        comparatorResult = 1;
      } else if (valueB != null) {
        comparatorResult = -1;
      }

      return comparatorResult * (direction === 'asc' ? 1 : -1);
    });
  }

  private _pageData(data: T[], paginator: MatPaginator): T[] {
    if (!paginator) {
      return data;
    }

    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    return data.slice(startIndex, startIndex + this.paginator.pageSize);
  }

  connect(): Observable<T[]> {
    if (!this._renderChangesSubscription) {
      this._updateChangesSubscription();
    }

    return this._renderData$;
  }

  disconnect(): void {
    this._renderChangesSubscription?.unsubscribe();
    this._renderChangesSubscription = null;
  }
}
