import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '@core/core.module';

import { SharedModule } from '@shared/shared.module';
import { FileUploadFieldComponent } from '@shared/components/file-upload-field/file-upload-field.component';

import { DatasetUploadComponent } from './dataset-upload.component';

describe('DatasetUploadComponent', () => {
  let component: DatasetUploadComponent;
  let fixture: ComponentFixture<DatasetUploadComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [CoreModule, SharedModule, RouterTestingModule],
        declarations: [DatasetUploadComponent, FileUploadFieldComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DatasetUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
