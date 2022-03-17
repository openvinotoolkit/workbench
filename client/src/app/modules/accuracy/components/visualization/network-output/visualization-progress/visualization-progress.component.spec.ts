import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualizationProgressComponent } from './visualization-progress.component';

describe('VisualizationProgressComponent', () => {
  let component: VisualizationProgressComponent;
  let fixture: ComponentFixture<VisualizationProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VisualizationProgressComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VisualizationProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
