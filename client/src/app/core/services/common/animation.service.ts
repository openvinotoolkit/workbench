import { ChangeDetectorRef, Component, ElementRef, Injectable, OnDestroy } from '@angular/core';
import { animate, keyframes, query, style, transition, trigger } from '@angular/animations';

import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

export enum AnimationTargetElement {
  MODEL_TABLE = 'model',
  DATASET_TABLE = 'dataset',
  MESSAGE_BOX = 'box',
  ADVISOR = 'advisor',
}

export const tableAnimation = trigger('highlight', [
  transition('false => true', [
    query(
      '.error',
      animate(
        2000,
        keyframes([
          style({
            backgroundColor: '#f6e5e5',
            offset: 0.6,
          }),
          style({
            backgroundColor: '#f8f8f8',
            offset: 1,
          }),
        ])
      ),
      { optional: true }
    ),
  ]),
]);

@Injectable({
  providedIn: 'root',
})
export class AnimationService {
  private _highlight$ = new Subject<AnimationTargetElement>();
  public highlight$ = this._highlight$.asObservable();

  highlight(elementName: AnimationTargetElement): void {
    this._highlight$.next(elementName);
  }
}

@Injectable()
export abstract class HighlightAnimation implements OnDestroy {
  public animationInProgress = false;

  private _unsubscribe$ = new Subject<void>();

  constructor(
    private _el: ElementRef,
    private _cdr: ChangeDetectorRef,
    private _animationService: AnimationService,
    private _targetElement: AnimationTargetElement
  ) {
    this._animationService.highlight$
      .pipe(
        takeUntil(this._unsubscribe$),
        filter((target: AnimationTargetElement) => target === this._targetElement)
      )
      .subscribe(() => {
        this.showInViewPort();
        this.highlight();
      });
  }

  highlight(): void {
    this.animationInProgress = true;
    this._cdr.detectChanges();
  }

  highlightFinished(): void {
    this.animationInProgress = false;
  }

  showInViewPort(): void {
    this._el.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }
}
