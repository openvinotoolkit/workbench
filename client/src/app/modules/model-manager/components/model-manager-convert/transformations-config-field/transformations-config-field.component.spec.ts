import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { SharedModule } from '@shared/shared.module';

import {
  TransformationsConfigFieldComponent,
  TransformationsConfigField,
} from './transformations-config-field.component';

const mockField: TransformationsConfigField = {
  name: 'name',
  options: [],
};

describe('TransformationsConfigFieldComponent', () => {
  let component: TransformationsConfigFieldComponent;
  let fixture: ComponentFixture<TransformationsConfigFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, SharedModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransformationsConfigFieldComponent);
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
