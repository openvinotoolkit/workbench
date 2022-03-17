import { TestBed } from '@angular/core/testing';

import { NotificationService } from '@core/services/common/notification.service';

describe('NotificationService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [NotificationService],
    })
  );

  it('should be created', () => {
    const service: NotificationService = TestBed.inject(NotificationService);
    expect(service).toBeTruthy();
  });
});
