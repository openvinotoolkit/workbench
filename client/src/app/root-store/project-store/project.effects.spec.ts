import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';
import { Action } from '@ngrx/store';

import { SharedModule } from '@shared/shared.module';

import { ProjectEffects } from './project.effects';
import { ProjectConverterService } from './project-converter.service';

describe('Project Effects', () => {
  const actions$: Observable<Action> = null;
  let effects: ProjectEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProjectEffects,
        ProjectConverterService,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: {} }),
      ],
      imports: [RouterTestingModule.withRoutes([]), HttpClientTestingModule, SharedModule],
    });

    effects = TestBed.inject(ProjectEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
