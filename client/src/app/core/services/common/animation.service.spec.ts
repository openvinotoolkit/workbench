import { TestBed } from '@angular/core/testing';

import { AnimationService } from '@core/services/common/animation.service';

describe('AnimationService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [AnimationService],
    })
  );

  it('should be created', () => {
    const service: AnimationService = TestBed.inject(AnimationService);
    expect(service).toBeTruthy();
  });
});
