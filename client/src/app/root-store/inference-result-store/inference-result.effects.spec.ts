import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';
import { Angulartics2Module } from 'angulartics2';
import { Action } from '@ngrx/store';

import { InferenceResultEffects } from './inference-result.effects';

describe('Inference Result Effects', () => {
  const actions$: Observable<Action> = null;
  let effects: InferenceResultEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, Angulartics2Module.forRoot()],
      providers: [InferenceResultEffects, provideMockActions(() => actions$), provideMockStore({ initialState: {} })],
    });

    effects = TestBed.inject(InferenceResultEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
