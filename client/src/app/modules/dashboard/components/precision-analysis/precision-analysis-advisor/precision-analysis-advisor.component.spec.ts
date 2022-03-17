import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrecisionAnalysisAdvisorComponent } from './precision-analysis-advisor.component';

describe('PrecisionAnalysisAdvisorComponent', () => {
  let component: PrecisionAnalysisAdvisorComponent;
  let fixture: ComponentFixture<PrecisionAnalysisAdvisorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrecisionAnalysisAdvisorComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrecisionAnalysisAdvisorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
