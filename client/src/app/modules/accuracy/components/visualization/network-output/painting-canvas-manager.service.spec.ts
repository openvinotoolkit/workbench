import { TestBed } from '@angular/core/testing';

import { PaintingCanvasManagerService } from './painting-canvas-manager.service';

describe('PaintingCanvasManagerService', () => {
  let service: PaintingCanvasManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PaintingCanvasManagerService] });
    service = TestBed.inject(PaintingCanvasManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
