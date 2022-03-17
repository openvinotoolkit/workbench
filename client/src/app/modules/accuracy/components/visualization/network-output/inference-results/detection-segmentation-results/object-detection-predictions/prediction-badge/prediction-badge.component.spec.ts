import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredictionBadgeComponent } from './prediction-badge.component';

describe('PredictionBadgeComponent', () => {
  let component: PredictionBadgeComponent;
  let fixture: ComponentFixture<PredictionBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PredictionBadgeComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PredictionBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
