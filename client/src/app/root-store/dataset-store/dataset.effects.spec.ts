import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';
import { Action } from '@ngrx/store';

import { DatasetEffects } from './dataset.effects';

describe('Dataset Effects', () => {
  const actions$: Observable<Action> = null;
  let effects: DatasetEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [DatasetEffects, provideMockActions(() => actions$), provideMockStore({ initialState: {} })],
    });

    effects = TestBed.inject(DatasetEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
