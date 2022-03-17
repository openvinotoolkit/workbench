import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { IACConfigControlErrors } from '../ac-config-editor';

type StatusBlockType = 'VALID' | 'PENDING' | 'INVALID';

@Component({
  selector: 'wb-status-block',
  templateUrl: './status-block.component.html',
  styleUrls: ['./status-block.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBlockComponent implements OnInit, OnDestroy {
  @Input() acConfigControl: FormControl;

  get status(): StatusBlockType {
    return this.acConfigControl.status as StatusBlockType;
  }

  get errors(): IACConfigControlErrors {
    return this.acConfigControl.errors as IACConfigControlErrors;
  }

  expanded = false;

  private _unsubscribe$ = new Subject<void>();

  constructor(private _cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.acConfigControl.statusChanges.pipe(takeUntil(this._unsubscribe$)).subscribe(() => this._cdr.detectChanges());
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }
}
