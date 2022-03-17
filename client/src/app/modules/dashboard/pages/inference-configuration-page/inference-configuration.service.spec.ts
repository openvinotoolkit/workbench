import { TestBed } from '@angular/core/testing';

import { InferenceConfigurationService } from './inference-configuration.service';

describe('InferenceConfigurationService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [InferenceConfigurationService],
    })
  );

  it('should be created', () => {
    const service: InferenceConfigurationService = TestBed.inject(InferenceConfigurationService);
    expect(service).toBeTruthy();
  });
});
