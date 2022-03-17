import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';
import { Action } from '@ngrx/store';

import { InferenceRestService } from '@core/services/api/rest/inference-rest.service';
import { ModelsService } from '@core/services/api/rest/models.service';

import { XmlGraphEffects } from './xml-graph.effects';

describe('XML Graph Effects', () => {
  const actions$: Observable<Action> = null;
  let effects: XmlGraphEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        XmlGraphEffects,
        ModelsService,
        InferenceRestService,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: {} }),
      ],
    });

    effects = TestBed.inject(XmlGraphEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
