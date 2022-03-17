import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '@shared/shared.module';

import { ConversionAdvancedParametersGroupComponent } from './conversion-advanced-parameters-group.component';

describe('ConversionAdvancedParametersGroupComponent', () => {
  let component: ConversionAdvancedParametersGroupComponent;
  let fixture: ComponentFixture<ConversionAdvancedParametersGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConversionAdvancedParametersGroupComponent],
      imports: [SharedModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversionAdvancedParametersGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
