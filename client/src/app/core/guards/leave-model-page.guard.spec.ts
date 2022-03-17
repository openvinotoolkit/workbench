import { TestBed, inject } from '@angular/core/testing';

import { LeaveModelPageGuard } from './leave-model-page.guard';

describe('CanDeactivateGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LeaveModelPageGuard],
    });
  });

  it('should ...', inject([LeaveModelPageGuard], (guard: LeaveModelPageGuard) => {
    expect(guard).toBeTruthy();
  }));
});
