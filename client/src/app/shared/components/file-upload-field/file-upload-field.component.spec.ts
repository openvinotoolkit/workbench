import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SharedModule } from '@shared/shared.module';

import { FileUploadFieldComponent } from './file-upload-field.component';

describe('FileUploadFieldComponent', () => {
  let component: FileUploadFieldComponent;
  let fixture: ComponentFixture<FileUploadFieldComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [FileUploadFieldComponent],
        imports: [SharedModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(FileUploadFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
