import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { SharedModule } from '@shared/shared.module';

import { TargetMachineFormComponent } from './target-machine-form.component';

describe('TargetMachineFormComponent', () => {
  let component: TargetMachineFormComponent;
  let fixture: ComponentFixture<TargetMachineFormComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [CommonModule, SharedModule, BrowserAnimationsModule, RouterTestingModule],
        declarations: [TargetMachineFormComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(TargetMachineFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
