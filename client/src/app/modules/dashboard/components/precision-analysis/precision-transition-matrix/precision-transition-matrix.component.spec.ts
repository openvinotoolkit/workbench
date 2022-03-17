import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrecisionTransitionMatrixComponent } from './precision-transition-matrix.component';

describe('PrecisionTransitionMatrixComponent', () => {
  let component: PrecisionTransitionMatrixComponent;
  let fixture: ComponentFixture<PrecisionTransitionMatrixComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrecisionTransitionMatrixComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrecisionTransitionMatrixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
