import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';
import { Action } from '@ngrx/store';

import { NotificationService } from '@core/services/common/notification.service';
import { SocketService } from '@core/services/api/socket/socket.service';

import { SharedModule } from '@shared/shared.module';

import { SocketEffects } from './socket.effects';

describe('SocketEffects', () => {
  const actions$: Observable<Action> = null;
  let effects: SocketEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, SharedModule],
      providers: [
        SocketEffects,
        SocketService,
        NotificationService,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: {} }),
      ],
    });

    effects = TestBed.inject<SocketEffects>(SocketEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
