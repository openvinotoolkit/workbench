import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';
import { Action } from '@ngrx/store';

import { TargetMachineEffects } from '@store/target-machine-store/target-machine.effects';

import { SharedModule } from '@shared/shared.module';

describe('Target Machine Effects', () => {
  const actions$: Observable<Action> = null;
  let effects: TargetMachineEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TargetMachineEffects, provideMockActions(() => actions$), provideMockStore({ initialState: {} })],
      imports: [HttpClientTestingModule, SharedModule, RouterTestingModule.withRoutes([])],
    });

    effects = TestBed.inject(TargetMachineEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
