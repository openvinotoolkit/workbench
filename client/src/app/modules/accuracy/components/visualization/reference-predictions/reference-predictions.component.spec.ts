import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferencePredictionsComponent } from './reference-predictions.component';

describe('ReferencePredictionsComponent', () => {
  let component: ReferencePredictionsComponent;
  let fixture: ComponentFixture<ReferencePredictionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReferencePredictionsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReferencePredictionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
