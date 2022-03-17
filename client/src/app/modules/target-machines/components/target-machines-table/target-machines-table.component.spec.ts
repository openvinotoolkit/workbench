import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from '@shared/shared.module';

import { TargetMachinesTableComponent } from './target-machines-table.component';

describe('TargetMachinesTableComponent', () => {
  let component: TargetMachinesTableComponent;
  let fixture: ComponentFixture<TargetMachinesTableComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [CommonModule, SharedModule, RouterTestingModule, BrowserAnimationsModule],
        declarations: [TargetMachinesTableComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(TargetMachinesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
