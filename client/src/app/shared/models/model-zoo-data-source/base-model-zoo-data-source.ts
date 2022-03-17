import { DataSource } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort/sort';

import { Observable } from 'rxjs';

export abstract class BaseModelZooDataSource<T> implements DataSource<T> {
  protected abstract _searchIdentityField: keyof T;

  protected readonly _matDataSource = new MatTableDataSource<T>();
  protected _originalData: T[] = [];

  set data(value: T[]) {
    this._originalData = value;
    this._matDataSource.data = value;
    this._matDataSource.paginator?.firstPage();
  }

  get data(): T[] {
    return this._originalData.slice();
  }

  set filter(value: string) {
    this._matDataSource.filter = value;
    this._matDataSource.paginator.firstPage();
  }

  get filteredData(): T[] {
    return this._matDataSource.filteredData;
  }

  // todo: sort on data set
  set sort(value: string) {
    this._matDataSource.data = this._sortData(this._matDataSource.filteredData, { active: value, direction: 'desc' });
    this._matDataSource.paginator.firstPage();
  }

  set paginator(value: MatPaginator) {
    this._matDataSource.paginator = value;
  }

  constructor() {
    this._matDataSource.filterPredicate = (model, search) => {
      const transformedSearch = search.trim().toLocaleLowerCase();
      return model[this._searchIdentityField].toString().toLocaleLowerCase().indexOf(transformedSearch) !== -1;
    };
  }

  connect(): Observable<T[]> {
    return this._matDataSource.connect();
  }

  disconnect(): void {
    this._matDataSource.disconnect();
  }

  // reuse mat table data source implementation to handle edge cases
  private _sortData(data: T[], { active, direction }: Sort): T[] {
    if (!active || direction === '') {
      return data;
    }

    return data.sort((a, b) => {
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
}
