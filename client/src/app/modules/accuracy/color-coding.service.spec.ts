import { TestBed } from '@angular/core/testing';

import { ColorCodingService } from './color-coding.service';

describe('ColorCodingService', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [ColorCodingService] }));

  it('should be created', () => {
    const service: ColorCodingService = TestBed.inject(ColorCodingService);
    expect(service).toBeTruthy();
  });
});
