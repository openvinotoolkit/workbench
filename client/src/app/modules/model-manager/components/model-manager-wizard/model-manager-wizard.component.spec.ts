import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { StoreModule } from '@ngrx/store';
import { Angulartics2Module } from 'angulartics2';

import { RootStoreState } from '@store';

import { SharedModule } from '@shared/shared.module';
import { FileUploadFieldComponent } from '@shared/components/file-upload-field/file-upload-field.component';

import { ModelManagerWizardComponent } from './model-manager-wizard.component';
import { ModelManagerImportComponent } from '../model-manager-import/model-manager-import.component';
import {
  ModelDownloaderTableComponent, // keep-line
} from '../model-downloader-table/model-downloader-table.component';
import { OmzModelInfoComponent } from '../omz-model-info/omz-model-info.component';
import { ModelDownloaderService } from '../model-downloader-table/model-downloader.service';

describe('ModelManagerWizardComponent', () => {
  let component: ModelManagerWizardComponent;
  let fixture: ComponentFixture<ModelManagerWizardComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          Angulartics2Module.forRoot(),
          BrowserAnimationsModule,
          RouterTestingModule,
          SharedModule,
          StoreModule.forRoot({
            ...RootStoreState.reducers,
          }),
        ],
        declarations: [
          ModelManagerWizardComponent,
          ModelManagerImportComponent,
          FileUploadFieldComponent,
          ModelDownloaderTableComponent,
          OmzModelInfoComponent,
        ],
        providers: [ModelDownloaderService],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelManagerWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
