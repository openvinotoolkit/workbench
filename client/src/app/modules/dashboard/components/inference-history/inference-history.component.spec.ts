import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';

import { StatusBarComponent } from '@shared/components/status-bar/status-bar.component';
import { SingleInferenceStatusPipe } from '@shared/pipes/inference-status/single-inference-status.pipe';

import { InferenceHistoryComponent } from './inference-history.component';

describe('InferenceHistoryComponent', () => {
  let component: InferenceHistoryComponent;
  let fixture: ComponentFixture<InferenceHistoryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule, MatTableModule, MatIconModule, MatCheckboxModule, MatTooltipModule],
      declarations: [InferenceHistoryComponent, StatusBarComponent, SingleInferenceStatusPipe],
      providers: [],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InferenceHistoryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should render inference history table', () => {
    component.inferenceResults = undefined;
    fixture.detectChanges();
    const inferenceHistoryTable = fixture.nativeElement.querySelector('[data-test-id="inference-history-table"]');
    expect(inferenceHistoryTable).toBeTruthy();
  });

  it('should display empty placeholder template for no input', () => {
    component.inferenceResults = undefined;
    fixture.detectChanges();
    const emptyDataContainer = fixture.nativeElement.querySelector('.empty-data-container');
    expect(emptyDataContainer).toBeTruthy();
  });
});
