import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerTensorImageVisualizationComponent } from './per-tensor-image-visualization.component';

describe('PerTensorImageVisualizationComponent', () => {
  let component: PerTensorImageVisualizationComponent;
  let fixture: ComponentFixture<PerTensorImageVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PerTensorImageVisualizationComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PerTensorImageVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
