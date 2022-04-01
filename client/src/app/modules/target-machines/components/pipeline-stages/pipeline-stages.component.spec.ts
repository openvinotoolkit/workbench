import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';

import { SharedModule } from '@shared/shared.module';

import { PipelineStagesComponent } from './pipeline-stages.component';
import { PipelineStageStatusComponent } from '../pipeline-stage-status/pipeline-stage-status.component';
import { PipelineStageDetailsComponent } from '../pipeline-stage-details/pipeline-stage-details.component';
import { StageTroubleshootComponent } from './stage-troubleshoot/stage-troubleshoot.component';

describe('PipelineStagesComponent', () => {
  let component: PipelineStagesComponent;
  let fixture: ComponentFixture<PipelineStagesComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [CommonModule, RouterTestingModule, SharedModule],
        declarations: [
          PipelineStagesComponent,
          PipelineStageStatusComponent,
          PipelineStageDetailsComponent,
          StageTroubleshootComponent,
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(PipelineStagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
