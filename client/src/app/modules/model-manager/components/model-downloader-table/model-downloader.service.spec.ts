import { TestBed } from '@angular/core/testing';

import { ModelDownloaderService } from './model-downloader.service';

describe('ModelDownloaderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ModelDownloaderService],
    });
  });

  it('should be created', () => {
    const service: ModelDownloaderService = TestBed.inject(ModelDownloaderService);
    expect(service).toBeTruthy();
  });
});
