import { DataSource } from '@angular/cdk/collections';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { HttpParams } from '@angular/common/http';
import { MatSort } from '@angular/material/sort';
import { EventEmitter } from '@angular/core';

import { BehaviorSubject, EMPTY, merge, Observable, of, Subscription } from 'rxjs';
import { catchError, finalize, map, startWith, switchMap, tap } from 'rxjs/operators';
import { isNumber } from 'lodash';

import { IPage } from '@core/services/api/rest/accuracy.service';

import { AppliedFilter } from '@shared/components/table-filter-form/filter-form.model';

interface IWbFilter {
  applyFilter: EventEmitter<AppliedFilter>;
  resetFilter: EventEmitter<void>;
  appliedFilter: AppliedFilter;
}

export class EntitiesDataSource<T> implements DataSource<T> {
  private _entities$ = new BehaviorSubject<IPage<T>>(null);
  public loading$ = new BehaviorSubject<boolean>(false);
  public total$ = this._entities$.asObservable().pipe(map((page) => page?.total ?? 0));

  private _changeSubscription: Subscription = null;

  private _paginator: MatPaginator = null;
  set paginator(value: MatPaginator) {
    this._paginator = value;
    this._updateChangeSubscription();
  }

  private _sort: MatSort = null;
  set sort(value: MatSort) {
    this._sort = value;
    this._updateChangeSubscription();
  }

  private _filter: IWbFilter = null;
  set filter(value: IWbFilter) {
    this._filter = value;
    this._updateChangeSubscription();
  }

  private _id: number;
  set id(value: number) {
    this._id = value;
    this._updateChangeSubscription();
  }

  private _httpParams: HttpParams = null;
  set httpParams(params: HttpParams) {
    this._httpParams = params;
    this._updateChangeSubscription();
  }

  constructor(private _getEntities: (id: number, params: HttpParams) => Observable<IPage<T>>) {}

  connect(): Observable<T[]> {
    return this._entities$.asObservable().pipe(map((page) => page?.entities || []));
  }

  disconnect(): void {
    this._entities$.complete();
    this.loading$.complete();
    this._changeSubscription.unsubscribe();
  }

  private _updateChangeSubscription(): void {
    const paginatorResetChange$ = merge(
      this._sort?.sortChange || EMPTY,
      this._filter?.applyFilter || EMPTY,
      this._filter?.resetFilter || EMPTY
    ).pipe(
      tap(() => {
        if (this._paginator) {
          this._paginator.pageIndex = 0;
        }
      })
    );

    const change$ = merge(this._paginator?.page || EMPTY, paginatorResetChange$).pipe(
      startWith({}),
      switchMap(() => this._load())
    );

    this._changeSubscription?.unsubscribe();
    this._changeSubscription = change$.subscribe();
  }

  private _load(): Observable<IPage<T>> {
    if (!isNumber(this._id)) {
      return of(null);
    }

    this.loading$.next(true);

    let params = new HttpParams();

    if (this._httpParams) {
      params = new HttpParams({ fromString: this._httpParams.toString() });
    }

    if (this._filter?.appliedFilter) {
      for (const { column, valueCondition, value } of this._filter.appliedFilter.filters) {
        params = new HttpParams({ fromString: params.toString() }).set(column, `${valueCondition} ${value}`);
      }
    }

    if (this._sort) {
      params = new HttpParams({ fromString: params.toString() }).set(
        'order_by',
        `${this._sort.active} ${this._sort.direction}`
      );
    }

    if (this._paginator) {
      params = new HttpParams({ fromString: params.toString() })
        .set('page', this._paginator.pageIndex.toString())
        .set('size', this._paginator.pageSize.toString());
    }

    return this._getEntities(this._id, params).pipe(
      catchError(() => of(null as IPage<T>)),
      tap((page) => this._entities$.next(page)),
      finalize(() => this.loading$.next(false))
    );
  }
}
