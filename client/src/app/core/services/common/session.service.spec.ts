import { TestBed } from '@angular/core/testing';

import { StoreModule } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';

import { RootStoreState } from '@store';

import { SessionService } from './session.service';

describe('SessionService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      providers: [MessagesService],
    })
  );

  it('should be created', () => {
    const service: SessionService = TestBed.inject(SessionService);
    expect(service).toBeTruthy();
  });
});
