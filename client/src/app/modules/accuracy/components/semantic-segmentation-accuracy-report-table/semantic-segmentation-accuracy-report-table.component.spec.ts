import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AccuracyRestService } from '@core/services/api/rest/accuracy.service';

import { SharedModule } from '@shared/shared.module';

import { SemanticSegmentationAccuracyReportTableComponent } from './semantic-segmentation-accuracy-report-table.component';

describe('SemanticSegmentationAccuracyReportTableComponent', () => {
  let component: SemanticSegmentationAccuracyReportTableComponent;
  let fixture: ComponentFixture<SemanticSegmentationAccuracyReportTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, NoopAnimationsModule],
      declarations: [SemanticSegmentationAccuracyReportTableComponent],
      providers: [AccuracyRestService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SemanticSegmentationAccuracyReportTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
