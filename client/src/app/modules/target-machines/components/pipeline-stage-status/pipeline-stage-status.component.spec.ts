import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { PipelineStageStatusComponent } from './pipeline-stage-status.component';

describe('PipelineStageStatusComponent', () => {
  let component: PipelineStageStatusComponent;
  let fixture: ComponentFixture<PipelineStageStatusComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [CommonModule, SharedModule],
        declarations: [PipelineStageStatusComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(PipelineStageStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
