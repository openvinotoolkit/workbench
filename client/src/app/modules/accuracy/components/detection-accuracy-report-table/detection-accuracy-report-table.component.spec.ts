import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AccuracyRestService } from '@core/services/api/rest/accuracy.service';

import { SharedModule } from '@shared/shared.module';

import { DetectionAccuracyReportTableComponent } from './detection-accuracy-report-table.component';

describe('DetectionAccuracyReportTableComponent', () => {
  let component: DetectionAccuracyReportTableComponent;
  let fixture: ComponentFixture<DetectionAccuracyReportTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, NoopAnimationsModule],
      declarations: [DetectionAccuracyReportTableComponent],
      providers: [AccuracyRestService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectionAccuracyReportTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
