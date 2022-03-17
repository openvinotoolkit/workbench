import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { StoreModule } from '@ngrx/store';
import { Angulartics2Module } from 'angulartics2';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';
import { FileUploadFieldComponent } from '@shared/components/file-upload-field/file-upload-field.component';

import { ImportCalibrationDatasetComponent } from './import-calibration-dataset.component';
import { DatasetUploadComponent } from '../../components/dataset-upload/dataset-upload.component';

describe('ImportCalibrationDatasetComponent', () => {
  let component: ImportCalibrationDatasetComponent;
  let fixture: ComponentFixture<ImportCalibrationDatasetComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          Angulartics2Module.forRoot(),
          BrowserAnimationsModule,
          SharedModule,
          RouterTestingModule,
          StoreModule.forRoot({
            ...RootStoreState.reducers,
          }),
        ],
        declarations: [ImportCalibrationDatasetComponent, DatasetUploadComponent, FileUploadFieldComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportCalibrationDatasetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
