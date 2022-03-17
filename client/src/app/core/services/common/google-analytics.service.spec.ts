import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Angulartics2Module } from 'angulartics2';

import { GoogleAnalyticsService } from './google-analytics.service';

describe('GoogleAnalyticsService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [Angulartics2Module.forRoot(), RouterTestingModule],
    })
  );

  it('should be created', () => {
    const service: GoogleAnalyticsService = TestBed.inject(GoogleAnalyticsService);
    expect(service).toBeTruthy();
  });
});
