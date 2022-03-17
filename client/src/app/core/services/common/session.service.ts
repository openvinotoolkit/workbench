import { Injectable, NgZone } from '@angular/core';

import { Store } from '@ngrx/store';
import { asyncScheduler, combineLatest, interval, of } from 'rxjs';
import { filter, map, observeOn, startWith, switchMap, takeWhile, withLatestFrom } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';
import { enterZone, leaveZone } from '@core/services/common/async.sheduler';

import { GlobalsStoreSelectors, RootStoreState } from '@store';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  readonly WARNING_THRESHOLD = 15 * 60 * 1000;

  private _session$ = this.store$.select(GlobalsStoreSelectors.selectSession);

  isSessionExists$ = this._session$.pipe(map((v) => !!v));

  private _remainingTime$ = interval(1000, leaveZone(this.ngZone, asyncScheduler)).pipe(
    observeOn(enterZone(this.ngZone, asyncScheduler)),
    startWith(null as number),
    withLatestFrom(this._session$),
    filter(([_, session]) => !!session),
    map(([_, session]) => {
      const remainingMs = session.created + session.ttlSeconds * 1000 - Date.now();
      return remainingMs > 0 ? remainingMs : 0;
    }),
    takeWhile((v) => !!v, true)
  );

  remainingTime$ = this.isSessionExists$.pipe(switchMap((exists) => (exists ? this._remainingTime$ : of(null))));

  startProcessWarningMessage$ = combineLatest([this.isSessionExists$, this.remainingTime$]).pipe(
    filter(([v]) => !!v),
    map(([_, remainingTime]) => {
      if (remainingTime > this.WARNING_THRESHOLD) {
        return null;
      }

      if (remainingTime < this.WARNING_THRESHOLD && remainingTime > 0) {
        return this.messagesService.hintMessages.session.expiresSoon;
      }

      if (remainingTime <= 0) {
        return this.messagesService.hintMessages.session.terminating;
      }
    })
  );

  constructor(
    private store$: Store<RootStoreState.State>,
    private messagesService: MessagesService,
    private ngZone: NgZone
  ) {}
}
