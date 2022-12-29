import { AfterViewInit, ChangeDetectorRef, Directive, ElementRef, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { MatLegacyTabGroup as MatTabGroup } from '@angular/material/legacy-tabs';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Directive fixes a mat-tab-group bug related to unexpected scrolling on a tab change
 * https://github.com/angular/components/issues/9592
 * Reproducible on chrome 86, firefox 84
 * Fixed on chrome 87
 */
@Directive({
  selector: '[wbMatTabGroupFix]',
})
export class MatTabGroupFixDirective implements AfterViewInit, OnDestroy {
  @HostBinding('style.min-height') minHeight = '0px';

  private readonly _unsubscribe$ = new Subject<void>();

  constructor(private _matTabGroup: MatTabGroup, private _el: ElementRef, private _cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this._matTabGroup.selectedTabChange.pipe(takeUntil(this._unsubscribe$)).subscribe(() => this._computeHeight());

    setTimeout(() => this._computeHeight());
  }

  ngOnDestroy() {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  private _computeHeight() {
    let height = 0;
    for (const node of this._el.nativeElement.childNodes) {
      height += node.offsetHeight;
    }
    this.minHeight = `${height}px`;
  }
}
