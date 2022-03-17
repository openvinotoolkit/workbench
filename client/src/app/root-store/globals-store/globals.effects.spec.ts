import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';
import { Action } from '@ngrx/store';

import { CoreModule } from '@core/core.module';

import { GlobalsEffects } from './globals.effects';

describe('Globals Effects', () => {
  const actions$: Observable<Action> = null;
  let effects: GlobalsEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, CoreModule],
      providers: [GlobalsEffects, provideMockActions(() => actions$)],
    });

    effects = TestBed.inject(GlobalsEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
