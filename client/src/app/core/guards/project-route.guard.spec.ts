import { TestBed, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store/index';

import { ProjectRouteGuard } from './project-route.guard';

describe('ProjectRouteGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      providers: [ProjectRouteGuard],
    });
  });

  it('should ...', inject([ProjectRouteGuard], (guard: ProjectRouteGuard) => {
    expect(guard).toBeTruthy();
  }));
});
