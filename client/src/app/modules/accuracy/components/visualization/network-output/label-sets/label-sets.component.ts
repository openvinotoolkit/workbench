import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ILabelSet } from '@store/inference-test-image-store/inference-test-image-models';
import { InferenceTestImageStoreSelectors, RootStoreState } from '@store';

@Component({
  selector: 'wb-label-sets',
  templateUrl: './label-sets.component.html',
  styleUrls: ['./label-sets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelSetsComponent implements OnInit, OnDestroy {
  public labelSetControl = new FormControl();

  public labelSets: ILabelSet[] = [];

  private _unsubscribe$ = new Subject();

  constructor(private _store$: Store<RootStoreState.State>, private _cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this._store$
      .select(InferenceTestImageStoreSelectors.selectLabelSets)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((labelSets) => {
        this.labelSets = labelSets;
        if (!this.labelSetControl.value) {
          this.labelSetControl.setValue(labelSets.find((v) => v.name === 'none' && v.id === 0));
        }
        this._cdr.detectChanges();
      });
  }

  ngOnDestroy() {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }
}
