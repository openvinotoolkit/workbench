import { TestBed } from '@angular/core/testing';
import { DecimalPipe } from '@angular/common';

import { LayersTableService } from './layers-table.service';

describe('LayersTableService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [LayersTableService, DecimalPipe],
    })
  );

  it('should be created', () => {
    const service: LayersTableService = TestBed.inject(LayersTableService);
    expect(service).toBeTruthy();
  });
});
