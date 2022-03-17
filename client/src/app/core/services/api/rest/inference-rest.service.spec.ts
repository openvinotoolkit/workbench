import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CompoundInferenceConfig } from '@shared/models/compound-inference-config';

import { ConnectionService } from '../connection.service';
import { InferenceRestService } from './inference-rest.service';

describe('Test autotune endpoints', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InferenceRestService, ConnectionService],
    });
  });

  it(
    'should send a post request on autotune endpoint',
    waitForAsync(
      // 1. declare as async test since the HttpClient works with Observables
      // 2. inject HttpClient and HttpTestingController into the test
      inject(
        [HttpClient, HttpTestingController, InferenceRestService],
        (http: HttpClient, httpMock: HttpTestingController, restService: InferenceRestService) => {
          // 3. send a simple request
          const config = new CompoundInferenceConfig(null);
          restService
            .runInference$(config)
            .toPromise()
            .then((response) => {});
          const method = 'POST';
          const mockReq = httpMock.expectOne({
            url: 'http://localhost:9876/api/v1/profile', // 9876 is the port Karma listens to.
            method,
          });

          expect(mockReq.cancelled).toBeFalsy();
          expect(mockReq.request.method).toEqual(method);
          httpMock.verify();
        }
      )
    )
  );
});
