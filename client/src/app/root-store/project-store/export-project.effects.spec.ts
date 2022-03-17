import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';
import { Action } from '@ngrx/store';

import { PopupService } from '@core/services/common/popup.service';

import { SharedModule } from '@shared/shared.module';

import { ExportProjectEffects } from './export-project.effects';

describe('ExportProjectEffects', () => {
  const actions$: Observable<Action> = null;
  let effects: ExportProjectEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, SharedModule, RouterTestingModule],
      providers: [
        ExportProjectEffects,
        PopupService,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: {} }),
      ],
    });

    effects = TestBed.inject<ExportProjectEffects>(ExportProjectEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
