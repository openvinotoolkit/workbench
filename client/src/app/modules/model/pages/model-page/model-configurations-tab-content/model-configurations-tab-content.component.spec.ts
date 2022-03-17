import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { SharedModule } from '@shared/shared.module';

import { ModelConfigurationsTabContentComponent } from './model-configurations-tab-content.component';

describe('ModelConfigurationsTabContentComponent', () => {
  let component: ModelConfigurationsTabContentComponent;
  let fixture: ComponentFixture<ModelConfigurationsTabContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      declarations: [ModelConfigurationsTabContentComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelConfigurationsTabContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
