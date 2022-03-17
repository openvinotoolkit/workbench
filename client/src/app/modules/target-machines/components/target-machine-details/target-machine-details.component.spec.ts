import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { TargetMachineDetailsComponent } from './target-machine-details.component';

describe('TargetMachineDetailsComponent', () => {
  let component: TargetMachineDetailsComponent;
  let fixture: ComponentFixture<TargetMachineDetailsComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [CommonModule, SharedModule],
        declarations: [TargetMachineDetailsComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(TargetMachineDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
