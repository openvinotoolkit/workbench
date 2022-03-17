import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { TargetMachineStatusComponent } from './target-machine-status.component';

describe('TargetMachineStatusComponent', () => {
  let component: TargetMachineStatusComponent;
  let fixture: ComponentFixture<TargetMachineStatusComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [CommonModule, SharedModule],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(TargetMachineStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
