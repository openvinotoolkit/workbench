import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { DeployRestService } from './deploy-rest.service';

describe('DeployRestService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    })
  );

  it('should be created', () => {
    const service: DeployRestService = TestBed.inject(DeployRestService);
    expect(service).toBeTruthy();
  });
});
