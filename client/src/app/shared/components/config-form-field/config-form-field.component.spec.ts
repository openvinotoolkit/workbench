import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormControl, FormGroup } from '@angular/forms';

import { SharedModule } from '@shared/shared.module';

import { AdvancedConfigField, ConfigFormFieldComponent } from './config-form-field.component';

const mockField: AdvancedConfigField = {
  type: 'input',
  name: 'name',
};

describe('ConfigFormFieldComponent', () => {
  let component: ConfigFormFieldComponent;
  let fixture: ComponentFixture<ConfigFormFieldComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [BrowserAnimationsModule, SharedModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigFormFieldComponent);
    component = fixture.componentInstance;
    component.field = mockField;
    component.group = new FormGroup({
      [mockField.name]: new FormControl(),
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
