import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';
import { Action } from '@ngrx/store';

import { SharedModule } from '@shared/shared.module';

import { DeploymentEffects } from './deployment.effects';

describe('DeploymentEffects', () => {
  const actions$: Observable<Action> = null;
  let effects: DeploymentEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, SharedModule, RouterTestingModule],
      providers: [DeploymentEffects, provideMockActions(() => actions$), provideMockStore({ initialState: {} })],
    });

    effects = TestBed.inject<DeploymentEffects>(DeploymentEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
