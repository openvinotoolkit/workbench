import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '@shared/shared.module';

import { AccuracyReportTypeRadioGroupComponent } from './accuracy-report-type-radio-group.component';

describe('AccuracyReportTypeRadioGroupComponent', () => {
  let component: AccuracyReportTypeRadioGroupComponent;
  let fixture: ComponentFixture<AccuracyReportTypeRadioGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      declarations: [AccuracyReportTypeRadioGroupComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AccuracyReportTypeRadioGroupComponent);
    component = fixture.componentInstance;
    component.accuracyReportOptions = {};
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
