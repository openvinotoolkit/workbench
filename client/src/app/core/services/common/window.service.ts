import { Injectable } from '@angular/core';

import { fromEvent } from 'rxjs';

import { Store } from '@ngrx/store';

import { RootStoreState } from '@store';

import { beforeunload, unload } from '@store/globals-store/globals.actions';

@Injectable({
  providedIn: 'root',
})
export class WindowService {
  constructor(private store$: Store<RootStoreState.State>) {}

  public initialize() {
    fromEvent(window, 'beforeunload').subscribe((event) => this.store$.dispatch(beforeunload({ event })));
    fromEvent(window, 'unload').subscribe(() => this.store$.dispatch(unload()));
  }
}
