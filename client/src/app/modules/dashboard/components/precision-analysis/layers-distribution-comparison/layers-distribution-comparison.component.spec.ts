import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayersDistributionComparisonComponent } from './layers-distribution-comparison.component';

describe('LayersDistributionComparisonComponent', () => {
  let component: LayersDistributionComparisonComponent;
  let fixture: ComponentFixture<LayersDistributionComparisonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LayersDistributionComparisonComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayersDistributionComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
