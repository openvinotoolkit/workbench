import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';
import { Action } from '@ngrx/store';

import { SharedModule } from '@shared/shared.module';

import { InferenceHistoryEffects } from './inference-history.effects';

describe('Inference History Effects', () => {
  const actions$: Observable<Action> = null;
  let effects: InferenceHistoryEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InferenceHistoryEffects, provideMockActions(() => actions$), provideMockStore({ initialState: {} })],
      imports: [RouterTestingModule.withRoutes([]), HttpClientTestingModule, SharedModule],
    });

    effects = TestBed.inject(InferenceHistoryEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
