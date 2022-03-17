import { TestBed } from '@angular/core/testing';

import { ModelGraphVisualizationService } from './model-graph-visualization.service';
import { ModelGraphLayersService } from './model-graph-layers.service';

describe('ModelGraphVisualizationService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [ModelGraphVisualizationService, ModelGraphLayersService],
    })
  );

  it('should be created', () => {
    const service: ModelGraphVisualizationService = TestBed.inject(ModelGraphVisualizationService);
    expect(service).toBeTruthy();
  });
});
