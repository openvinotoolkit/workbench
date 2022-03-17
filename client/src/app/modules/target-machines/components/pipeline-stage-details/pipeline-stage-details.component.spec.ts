import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PipelineStageDetailsComponent } from './pipeline-stage-details.component';

describe('PipelineStageDetailsComponent', () => {
  let component: PipelineStageDetailsComponent;
  let fixture: ComponentFixture<PipelineStageDetailsComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [PipelineStageDetailsComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(PipelineStageDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
