import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrecisionAnalysisComponent } from './precision-analysis.component';

describe('PrecisionAnalysisComponent', () => {
  let component: PrecisionAnalysisComponent;
  let fixture: ComponentFixture<PrecisionAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrecisionAnalysisComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrecisionAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
