import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';

import { DialogService } from './dialog.service';

describe('DialogService', () => {
  let service: DialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatDialogModule],
      providers: [MatDialog, Overlay],
    });
    service = TestBed.inject(DialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
