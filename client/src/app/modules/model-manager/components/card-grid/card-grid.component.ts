import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  Directive,
  Input,
  OnDestroy,
  TemplateRef,
} from '@angular/core';
import { DataSource } from '@angular/cdk/collections';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Directive({ selector: '[wbCardDef]' })
export class CardDefDirective<T> {
  static ngTemplateContextGuard<T>(dir: CardDefDirective<T>, ctx: unknown): ctx is { $implicit: T } {
    return true;
  }

  constructor(readonly templateRef: TemplateRef<unknown>) {}
}

@Component({
  selector: 'wb-card-grid',
  templateUrl: './card-grid.component.html',
  styleUrls: ['./card-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardGridComponent<T> implements AfterContentInit, OnDestroy {
  @Input() dataSource: DataSource<T> = null;

  @Input() isLoading = false;

  @ContentChild(CardDefDirective) cardDirective: CardDefDirective<T> = null;

  data: readonly T[] = null;

  private readonly _unsubscribe$ = new Subject<void>();

  constructor(private readonly _cdr: ChangeDetectorRef) {}

  ngAfterContentInit(): void {
    this.dataSource
      .connect(null)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((data) => {
        this.data = data;
        this._cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
    this.dataSource.disconnect(null);
  }
}
