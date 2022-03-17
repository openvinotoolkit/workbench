import { inject, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { StoreModule } from '@ngrx/store';

import { TargetMachinesRouteGuard } from '@core/guards/target-machines-route.guard';

import { RootStoreState } from '@store/index';

describe('TargetMachinesRouteGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      providers: [TargetMachinesRouteGuard],
    });
  });

  it('should ...', inject([TargetMachinesRouteGuard], (guard: TargetMachinesRouteGuard) => {
    expect(guard).toBeTruthy();
  }));
});
