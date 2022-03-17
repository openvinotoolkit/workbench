import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MessagesService } from '@core/services/common/messages.service';

import { MaterialModule } from '@shared/material.module';
import { HelpTooltipComponent } from '@shared/components/help-tooltip/help-tooltip.component';

import { MetricThresholdComponent } from './metric-threshold.component';

describe('MetricThresholdComponent', () => {
  let component: MetricThresholdComponent;
  let fixture: ComponentFixture<MetricThresholdComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [ReactiveFormsModule, MaterialModule, NoopAnimationsModule],
        providers: [MessagesService],
        declarations: [MetricThresholdComponent, HelpTooltipComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(MetricThresholdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
