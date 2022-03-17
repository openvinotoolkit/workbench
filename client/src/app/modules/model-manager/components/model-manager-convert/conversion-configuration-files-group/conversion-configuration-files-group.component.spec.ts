import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '@shared/shared.module';

import { ConversionConfigurationFilesGroupComponent } from './conversion-configuration-files-group.component';
import { HelpChecklistModule } from '../help-checklist/help-checklist.module';

describe('ConversionConfigurationFilesGroupComponent', () => {
  let component: ConversionConfigurationFilesGroupComponent;
  let fixture: ComponentFixture<ConversionConfigurationFilesGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConversionConfigurationFilesGroupComponent],
      imports: [SharedModule, HelpChecklistModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversionConfigurationFilesGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
