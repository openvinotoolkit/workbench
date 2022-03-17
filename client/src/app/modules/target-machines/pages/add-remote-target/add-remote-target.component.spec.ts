import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '@core/core.module';

import { SharedModule } from '@shared/shared.module';

import { AddRemoteTargetComponent } from './add-remote-target.component';
import { TargetMachineFormComponent } from '../../components/target-machine-form/target-machine-form.component';

describe('AddRemoteTargetComponent', () => {
  let component: AddRemoteTargetComponent;
  let fixture: ComponentFixture<AddRemoteTargetComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [RouterTestingModule, CoreModule, SharedModule],
        declarations: [AddRemoteTargetComponent, TargetMachineFormComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRemoteTargetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
