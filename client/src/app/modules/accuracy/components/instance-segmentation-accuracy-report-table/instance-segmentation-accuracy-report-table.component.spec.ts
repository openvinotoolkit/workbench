import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AccuracyRestService } from '@core/services/api/rest/accuracy.service';

import { SharedModule } from '@shared/shared.module';

import { InstanceSegmentationAccuracyReportTableComponent } from './instance-segmentation-accuracy-report-table.component';

describe('InstanceSegmentationAccuracyReportTableComponent', () => {
  let component: InstanceSegmentationAccuracyReportTableComponent;
  let fixture: ComponentFixture<InstanceSegmentationAccuracyReportTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, NoopAnimationsModule],
      declarations: [InstanceSegmentationAccuracyReportTableComponent],
      providers: [AccuracyRestService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstanceSegmentationAccuracyReportTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
