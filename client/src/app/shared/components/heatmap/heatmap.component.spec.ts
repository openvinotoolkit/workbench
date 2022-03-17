import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HeatmapComponent } from './heatmap.component';

describe('HeatmapComponent', () => {
  let component: HeatmapComponent;
  let fixture: ComponentFixture<HeatmapComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [HeatmapComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(HeatmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct labels for big execution time', () => {
    const intervalMiddleValue = 500.434;
    component.intervals = [
      [0, intervalMiddleValue],
      [intervalMiddleValue, 1000.212],
    ];
    expect(component.labels).toEqual(['0 - \n500', '500 - \n1000']);
  });

  it('should return correct labels for average execution time', () => {
    const intervalMiddleValue = 0.43455;
    component.intervals = [
      [0, intervalMiddleValue],
      [intervalMiddleValue, 1.21267],
    ];
    expect(component.labels).toEqual(['0 - \n0.435', '0.435 - \n1.213']);
  });

  it('should return correct labels for small execution time', () => {
    const intervalMiddleValue = 0.23434324;
    component.intervals = [
      [0, intervalMiddleValue],
      [intervalMiddleValue, 0.45454545],
    ];
    expect(component.labels).toEqual(['0 - \n0.2343', '0.2343 - \n0.4545']);
  });

  it('should return correct labels for empty intervals', () => {
    component.intervals = [];
    expect(component.labels).toEqual([]);

    component.intervals = null;
    expect(component.labels).toEqual([]);

    component.intervals = undefined;
    expect(component.labels).toEqual([]);
  });
});
