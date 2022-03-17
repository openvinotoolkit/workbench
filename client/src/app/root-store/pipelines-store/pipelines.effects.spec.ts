import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';
import { Action } from '@ngrx/store';

import { PipelinesEffects } from '@store/pipelines-store/pipelines.effects';

describe('Pipeline Effects', () => {
  const actions$: Observable<Action> = null;
  let effects: PipelinesEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PipelinesEffects, provideMockActions(() => actions$), provideMockStore({ initialState: {} })],
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
    });

    effects = TestBed.inject(PipelinesEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
