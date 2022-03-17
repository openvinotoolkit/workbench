import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SharedComponentsModule } from '@shared/components/shared-components.module';

import { ParameterDetailsComponent } from './parameter-details.component';

describe('ParameterDetailsComponent', () => {
  let component: ParameterDetailsComponent;
  let fixture: ComponentFixture<ParameterDetailsComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [SharedComponentsModule, NoopAnimationsModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ParameterDetailsComponent);
    component = fixture.componentInstance;
    component.parameter = { tooltip: null, label: '', value: '' };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
