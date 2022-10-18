import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { SharedModule } from '@shared/shared.module';
import { FileUploadFieldComponent } from '@shared/components/file-upload-field/file-upload-field.component';

import { ModelManagerImportComponent } from './model-manager-import.component';

describe('ModelManagerImportComponent', () => {
  let component: ModelManagerImportComponent;
  let fixture: ComponentFixture<ModelManagerImportComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [RouterTestingModule, BrowserAnimationsModule, SharedModule],
        declarations: [ModelManagerImportComponent, FileUploadFieldComponent],
        providers: [],
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
