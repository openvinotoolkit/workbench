import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';
import { Action } from '@ngrx/store';

import { AuthStoreEffects } from './auth-store.effects';

describe('AuthStoreEffects', () => {
  const actions$: Observable<Action> = null;
  let effects: AuthStoreEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [AuthStoreEffects, provideMockActions(() => actions$), provideMockStore({ initialState: {} })],
    });

    effects = TestBed.inject<AuthStoreEffects>(AuthStoreEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
