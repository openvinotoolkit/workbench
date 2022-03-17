import { TestBed } from '@angular/core/testing';

import { PrecisionAnalysisService } from './precision-analysis.service';

describe('PrecisionAnalysisService', () => {
  let service: PrecisionAnalysisService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrecisionAnalysisService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
