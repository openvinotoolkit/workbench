import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SharedModule } from '@shared/shared.module';

import { InferenceMatrixCellComponent } from './inference-matrix-cell.component';

describe('InferenceMatrixCellComponent', () => {
  let component: InferenceMatrixCellComponent;
  let fixture: ComponentFixture<InferenceMatrixCellComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [SharedModule],
        declarations: [InferenceMatrixCellComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(InferenceMatrixCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
