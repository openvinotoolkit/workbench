import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { AccuracyRestService } from '@core/services/api/rest/accuracy.service';

import { ModelTaskTypes } from '@store/model-store/model.model';

import { SharedModule } from '@shared/shared.module';
import { AccuracyReportType } from '@shared/models/accuracy-analysis/accuracy-report';

import { PerTensorAccuracyReportTableComponent } from './per-tensor-accuracy-report-table.component';
import { DynamicTableComponent } from '../dynamic-table/dynamic-table.component';

describe('PerTensorAccuracyReportTableComponent', () => {
  let component: PerTensorAccuracyReportTableComponent;
  let fixture: ComponentFixture<PerTensorAccuracyReportTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SharedModule, RouterTestingModule],
      declarations: [PerTensorAccuracyReportTableComponent, DynamicTableComponent],
      providers: [AccuracyRestService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PerTensorAccuracyReportTableComponent);
    component = fixture.componentInstance;
    component.report = {
      id: 1,
      reportType: AccuracyReportType.DATASET_ANNOTATIONS,
      taskType: ModelTaskTypes.CLASSIFICATION,
      metricType: 'metric',
      metricName: null,
      accuracyResult: 99,
      accuracyPostfix: '%',
      projectId: 1,
      targetDatasetId: 1,
      outputNames: ['output'],
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
