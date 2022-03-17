import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayersDistributionComponent } from './layers-distribution.component';

describe('LayersDistributionComponent', () => {
  let component: LayersDistributionComponent;
  let fixture: ComponentFixture<LayersDistributionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LayersDistributionComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayersDistributionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
