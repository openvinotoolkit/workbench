import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ExportProjectRestService } from './export-project-rest.service';

describe('ExportProjectRestService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    })
  );

  it('should be created', () => {
    const service: ExportProjectRestService = TestBed.inject(ExportProjectRestService);
    expect(service).toBeTruthy();
  });
});
