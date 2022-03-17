import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AccuracyRestService } from '@core/services/api/rest/accuracy.service';

import { SharedModule } from '@shared/shared.module';

import { ClassificationAccuracyReportTableComponent } from './classification-accuracy-report-table.component';

describe('ClassificationAccuracyReportTableComponent', () => {
  let component: ClassificationAccuracyReportTableComponent;
  let fixture: ComponentFixture<ClassificationAccuracyReportTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, NoopAnimationsModule],
      declarations: [ClassificationAccuracyReportTableComponent],
      providers: [AccuracyRestService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassificationAccuracyReportTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
