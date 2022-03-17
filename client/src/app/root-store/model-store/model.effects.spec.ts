import { RouterTestingModule } from '@angular/router/testing';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';
import { Action } from '@ngrx/store';

import { ModelEffects } from './model.effects';

describe('Model Effects', () => {
  const actions$: Observable<Action> = null;
  let effects: ModelEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ModelEffects, provideMockActions(() => actions$), provideMockStore({ initialState: {} })],
      imports: [HttpClientTestingModule, RouterTestingModule],
    });

    effects = TestBed.inject(ModelEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
