import { TestBed } from '@angular/core/testing';

import { PrecisionAnalysisAdvisorService } from './precision-analysis-advisor.service';

describe('PrecisionAnalysisAdvisorService', () => {
  let service: PrecisionAnalysisAdvisorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrecisionAnalysisAdvisorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
