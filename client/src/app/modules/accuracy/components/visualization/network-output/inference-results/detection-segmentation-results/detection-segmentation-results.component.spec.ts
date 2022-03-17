import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectionSegmentationResultsComponent } from './detection-segmentation-results.component';

describe('DetectionSegmentationResultsComponent', () => {
  let component: DetectionSegmentationResultsComponent;
  let fixture: ComponentFixture<DetectionSegmentationResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetectionSegmentationResultsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectionSegmentationResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
