import { TestBed, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store/index';

import { ModelRouteGuard } from './model-route.guard';

describe('ModelRouteGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      providers: [ModelRouteGuard],
    });
  });

  it('should ...', inject([ModelRouteGuard], (guard: ModelRouteGuard) => {
    expect(guard).toBeTruthy();
  }));
});
