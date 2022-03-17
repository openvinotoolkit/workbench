import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SharedModule } from '@shared/shared.module';

import { InferenceMatrixSelectComponent } from './inference-matrix-select.component';
import { InferenceMatrixCellComponent } from './inference-matrix-cell/inference-matrix-cell.component';

describe('InferenceMatrixSelectComponent', () => {
  let component: InferenceMatrixSelectComponent;
  let fixture: ComponentFixture<InferenceMatrixSelectComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [SharedModule],
        declarations: [InferenceMatrixSelectComponent, InferenceMatrixCellComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(InferenceMatrixSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
