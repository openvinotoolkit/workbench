import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversionGeneralParametersGroupComponent } from './conversion-general-parameters-group.component';
import { HelpChecklistModule } from '../help-checklist/help-checklist.module';

describe('ConversionGeneralParametersGroupComponent', () => {
  let component: ConversionGeneralParametersGroupComponent;
  let fixture: ComponentFixture<ConversionGeneralParametersGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConversionGeneralParametersGroupComponent],
      imports: [HelpChecklistModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversionGeneralParametersGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
