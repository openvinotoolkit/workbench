import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreModule } from '@ngrx/store';

import { RootStoreState } from '@store';

import { CalibrationDatasetSectionComponent } from './calibration-dataset-section.component';

describe('CalibrationDatasetSectionComponent', () => {
  let component: CalibrationDatasetSectionComponent;
  let fixture: ComponentFixture<CalibrationDatasetSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({
          ...RootStoreState.reducers,
        }),
      ],
      declarations: [CalibrationDatasetSectionComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CalibrationDatasetSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
