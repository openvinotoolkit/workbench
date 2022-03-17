import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { SharedModule } from '@shared/shared.module';
import { FileUploadFieldComponent } from '@shared/components/file-upload-field/file-upload-field.component';

import { ModelManagerImportComponent } from './model-manager-import.component';
import {
  ModelDownloaderTableComponent, // keep-line
} from '../model-downloader-table/model-downloader-table.component';
import { ModelDownloaderService } from '../model-downloader-table/model-downloader.service';

describe('ModelManagerImportComponent', () => {
  let component: ModelManagerImportComponent;
  let fixture: ComponentFixture<ModelManagerImportComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [RouterTestingModule, BrowserAnimationsModule, SharedModule],
        declarations: [ModelManagerImportComponent, FileUploadFieldComponent, ModelDownloaderTableComponent],
        providers: [ModelDownloaderService],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelManagerImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
