import { TestBed } from '@angular/core/testing';

import { ModelGraphLayersService } from './model-graph-layers.service';

describe('ModelGraphLayersService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ModelGraphLayersService],
    });
  });

  it('should be created', () => {
    const service: ModelGraphLayersService = TestBed.inject(ModelGraphLayersService);
    expect(service).toBeTruthy();
  });
});
