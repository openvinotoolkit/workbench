import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrecisionDistributionComponent } from './precision-distribution.component';

describe('PrecisionDistributionComponent', () => {
  let component: PrecisionDistributionComponent;
  let fixture: ComponentFixture<PrecisionDistributionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrecisionDistributionComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrecisionDistributionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
